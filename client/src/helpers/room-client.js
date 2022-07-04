import { Device } from 'mediasoup-client';

import { MediaTypes } from '../services/constants';
import { socket, soc } from '../services/socket-init';

const localMediaEl = 'local-video';
const remoteVideoEl = 'remote-videos';
const remoteAudioEl = 'remote-audios';

let _isOpen = false;
let isVideoOnFullScreen = false;

let producer;
let device = null;
let producerTransport = null;
let consumerTransport = null;

const consumers = new Map();
const producers = new Map();
const producerLabel = new Map();


////////// INIT /////////

const loadDevice = async (routerRtpCapabilities) => {
  try {
    const device = new Device();
    await device.load({ routerRtpCapabilities });

    return device;
  } catch (error) {
    if (error.name === 'UnsupportedError') {
      console.error('Browser not supported');
      alert('Browser not supported');
    }
    console.error(error);
  }
}


const initTransports = async (device) => {
  // init producerTransport
  {
    const data = await soc('createWebRtcTransport', {
      forceTcp: false,
      rtpCapabilities: device.rtpCapabilities
    });

    if (data.error) {
      console.error(data.error);
      return;
    }

    producerTransport = device.createSendTransport(data);

    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await soc('connectTransport', { dtlsParameters, transport_id: data.id });
        callback();
      } catch (e) {
        errback();
      }
    });

    producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { producer_id } = await soc('produce', {
          producerTransportId: producerTransport.id,
          kind,
          rtpParameters
        });

        callback({ id: producer_id });
      } catch (e) {
        errback(e);
      }
    });

    producerTransport.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          break;

        case 'connected':
          break;

        case 'failed':
          producerTransport.close();
          break;

        default:
          break;
      }
    });
  }

  // init consumerTransport
  {
    const data = await soc('createWebRtcTransport', { forceTcp: false });

    if (data.error) {
      console.error(data.error);
      return;
    }

    // only one needed
    consumerTransport = device.createRecvTransport(data);

    consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await soc('connectTransport', { transport_id: consumerTransport.id, dtlsParameters });
        callback();
      } catch (e) {
        errback();
      }
    });

    consumerTransport.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          break;

        case 'connected':
          //remoteVideo.srcObject = await stream;
          //await soc('resume');
          break;

        case 'failed':
          consumerTransport.close();
          break;

        default:
          break;
      }
    });
  }
}


const join = async (username, room_id) => {
  try {
    const d = await soc('join', { username, room_id });
    console.log('Joined to room', d);

    const data = await soc('getRouterRtpCapabilities');
    device = await loadDevice(data);
    await initTransports(device);

    socket.emit('getProducers');
  } catch (e) {
    console.log('Join error:', e);
  }
}


const removeConsumer = (consumer_id) => {
  const elem = document.getElementById(consumer_id);

  elem.srcObject.getTracks().forEach((track) => track.stop());
  elem.parentNode.removeChild(elem);

  consumers.delete(consumer_id);
}


export const exit = async (offline = false) => {
  const clean = () => {
    _isOpen = false;
    consumerTransport.close();
    producerTransport.close();
    socket.off('disconnect');
    socket.off('newProducers');
    socket.off('consumerClosed');
  };

  if (!offline) {
    try {
      const d = await soc('exitRoom');
      console.log(d);
    } catch (e) {
      console.warn(e)
    } finally {
      clean();
    }
  } else {
    clean();
  }
}


const initSockets = () => {
  socket.on('consumerClosed', ({ consumer_id }) => {
    console.log('Closing consumer:', consumer_id);
    removeConsumer(consumer_id);
    window.sessionStorage.setItem('layout', `${consumers.size}`)
    socket.emit('counter')
  });

  socket.on('newProducers', async (data) => {
    console.log('New producers', data);
    for (const { producer_id } of data) {
      await consume(producer_id);
    }
    window.sessionStorage.setItem('layout', `${consumers.size}`)
    socket.emit('counter')
  });

  socket.on('disconnect', async () => {
    await exit(true);
  });
}


export const createRoom = async (room_id, username) => {
  try {
    await soc('createRoom', { room_id });
    await join(username, room_id);
    initSockets();
    _isOpen = true;
  } catch (e) {
    console.log('Create room error:', e);
  }
}


//////// MAIN FUNCTIONS /////////////

export const produce = async (type, deviceId = null) => {
  let mediaConstraints = {};
  let audio = false;
  let screen = false;

  switch (type) {
    case MediaTypes.audio:
      mediaConstraints = {
        audio: { deviceId: deviceId },
        video: false
      };
      audio = true;
      break;
    case MediaTypes.video:
      mediaConstraints = {
        audio: false,
        video: {
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
          deviceId: deviceId,
        }
      };
      break;
    case MediaTypes.screen:
      mediaConstraints = false;
      screen = true;
      break;
    default:
      return;
  }
  if (!device.canProduce('video') && !audio) {
    console.error('Cannot produce video');
    return;
  }
  if (producerLabel.has(type)) {
    console.log('Producer already exists for this type ' + type);
    return;
  }
  console.log('MediaConstraints:', mediaConstraints);
  let stream;
  try {
    stream = screen
      ? await navigator.mediaDevices.getDisplayMedia()
      : await navigator.mediaDevices.getUserMedia(mediaConstraints);
    console.log(navigator.mediaDevices.getSupportedConstraints());

    const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
    const params = { track }

    if (!audio && !screen) {
      params.encodings = [
        {
          rid: 'r0',
          maxBitrate: 100000,
          //scaleResolutionDownBy: 10.0,
          scalabilityMode: 'S1T3'
        },
        {
          rid: 'r1',
          maxBitrate: 300000,
          scalabilityMode: 'S1T3'
        },
        {
          rid: 'r2',
          maxBitrate: 900000,
          scalabilityMode: 'S1T3'
        }
      ];
      params.codecOptions = {
        videoGoogleStartBitrate: 1000
      };
    }
    producer = await producerTransport.produce(params);

    console.log('Producer', producer);

    producers.set(producer.id, producer);

    let elem;
    if (!audio) {
      elem = document.createElement('video');
      elem.srcObject = stream;
      elem.id = producer.id;
      elem.setAttribute('playsinline', 'true');
      elem.setAttribute('autoplay', 'true');
      elem.setAttribute('muted', 'true');
      document.getElementById(localMediaEl).appendChild(elem);
      handleFS(elem.id);
    }

    producer.on('trackended', () => {
      closeProducer(type);
    });

    producer.on('transportclose', () => {
      console.log('Producer transport close');
      if (!audio) {
        elem.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
        elem.parentNode.removeChild(elem);
      }
      producers.delete(producer.id);
    });

    producer.on('close', () => {
      console.log('Closing producer');
      if (!audio) {
        elem.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
        elem.parentNode.removeChild(elem);
      }
      producers.delete(producer.id);
    });

    producerLabel.set(type, producer.id);
  } catch (err) {
    console.log('Produce error:', err);
  }
}


const getConsumeStream = async (producerId) => {
  const { rtpCapabilities } = device;

  const { id, kind, rtpParameters } = await soc('consume', {
    rtpCapabilities,
    consumerTransportId: consumerTransport.id, // might be
    producerId
  });

  const codecOptions = {};
  const consumer = await consumerTransport.consume({
    id,
    producerId,
    kind,
    rtpParameters,
    codecOptions
  });

  const stream = new MediaStream();
  stream.addTrack(consumer.track);

  return {
    consumer,
    stream,
    kind
  };
}


export const consume = async (producer_id) => {
  const { consumer, stream, kind } = await getConsumeStream(producer_id)
  consumers.set(consumer.id, consumer);

  let elem;
  if (kind === 'video') {
    elem = document.createElement('video');
    elem.srcObject = stream;
    elem.id = consumer.id;
    elem.setAttribute('playsinline', 'true');
    elem.setAttribute('autoplay', 'true');
    elem.setAttribute('muted', 'true');
    elem.className = 'vid';
    document.getElementById(remoteVideoEl).appendChild(elem);
    handleFS(elem.id);
  } else {
    elem = document.createElement('audio');
    elem.srcObject = stream;
    elem.id = consumer.id;
    elem.playsinline = false;
    elem.autoplay = true;
    document.getElementById(remoteAudioEl).appendChild(elem);
  }

  consumer.on('trackended', () => removeConsumer(consumer.id));

  consumer.on('transportclose', () => removeConsumer(consumer.id));
}


export const closeProducer = (type) => {
  if (!producerLabel.has(type)) {
    console.log('There is no producer for this type ' + type);
    return;
  }

  const producer_id = producerLabel.get(type);
  console.log('Close producer', producer_id);

  socket.emit('producerClosed', producer_id);

  producers.get(producer_id).close();
  producers.delete(producer_id);
  producerLabel.delete(type);

  if (type !== MediaTypes.audio) {
    const elem = document.getElementById(`${producer_id}`);
    elem.srcObject.getTracks().forEach((track) => track.stop());
    elem.parentNode.removeChild(elem);
  }
}


export const isOpen = () => {
  return _isOpen;
}


//////// UTILITY ////////

const handleFS = (id) => {
  const videoPlayer = document.getElementById(id);

  videoPlayer.addEventListener('fullscreenchange', () => {
    if (videoPlayer.controls) return;

    const fullscreenElement = document['fullscreenElement'];

    if (!fullscreenElement) {
      isVideoOnFullScreen = false;
    }
  });

  videoPlayer.addEventListener('webkitfullscreenchange', () => {
    if (videoPlayer.controls) return;

    const webkitIsFullScreen = document['webkitIsFullScreen'];

    if (!webkitIsFullScreen) {
      isVideoOnFullScreen = false;
    }
  });

  videoPlayer.addEventListener('click', async () => {
    if (videoPlayer.controls) return;

    if (!isVideoOnFullScreen) {
      if (videoPlayer.requestFullscreen) {
        await videoPlayer.requestFullscreen();
      } else if (videoPlayer['webkitRequestFullscreen']) {
        videoPlayer['webkitRequestFullscreen']();
      } else if (videoPlayer['msRequestFullscreen']) {
        videoPlayer['msRequestFullscreen']();
      } else if (videoPlayer['webkitEnterFullscreen']) {
        videoPlayer['webkitEnterFullscreen']();
      }

      isVideoOnFullScreen = true;
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document['webkitCancelFullScreen']) {
        document['webkitCancelFullScreen']();
      } else if (document['msExitFullscreen']) {
        document['msExitFullscreen']();
      }

      videoPlayer.play();
      isVideoOnFullScreen = false;
    }
  });
}

