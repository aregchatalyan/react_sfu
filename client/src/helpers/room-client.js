import * as mediasoup from 'mediasoup-client';

import { MediaTypes } from '../services/constants';
import { soc, socket } from '../services/socket-init';

let _isOpen = false;

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
    const device = new mediasoup.Device();
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

const removeConsumer = (consumer_id, setMedia) => {
  setMedia(prev => {
    prev.remote.forEach((item) => {
      if (item.id === consumer_id) {
        const track = item.audio || item.video;
        track.getTracks().forEach((track) => track.stop());
      }
    });

    return {
      ...prev,
      remote: [ ...prev.remote.filter(item => item.id !== consumer_id) ]
    }
  });

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

const initSockets = (setMedia) => {
  socket.on('consumerClosed', ({ consumer_id }) => {
    console.log('Closing consumer:', consumer_id);
    removeConsumer(consumer_id, setMedia);
  });

  socket.on('newProducers', async (data) => {
    console.log('New producers', data);
    for (const { producer_id } of data) {
      await consume(producer_id, setMedia);
    }
  });

  socket.on('disconnect', async () => {
    await exit(true);
  });
}

export const createRoom = async (room_id, username, setMedia) => {
  try {
    await soc('createRoom', { room_id });
    await join(username, room_id);
    initSockets(setMedia);
    _isOpen = true;
  } catch (e) {
    console.log('Create room error:', e);
  }
}

//////// MAIN FUNCTIONS /////////////
export const produce = async (type, deviceId = null, setMedia) => {
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

    if (!audio) {
      setMedia(prev => ({
        ...prev,
        local: [ ...prev.local, { id: producer.id, video: stream } ]
      }));
    }

    producer.on('trackended', () => {
      closeProducer(type, setMedia);
    });

    const close = () => {
      if (!audio) {
        setMedia(prev => {
          prev.local.forEach((item) => {
            if (item.id === producer.id)
              item.video.getTracks().forEach((track) => track.stop());
          });

          return {
            ...prev,
            local: [ ...prev.local.filter(item => item.id !== producer.id) ]
          }
        });
      }
      producerLabel.delete(type);
      producers.delete(producer.id);
    }

    producer.on('transportclose', () => {
      console.log('Producer transport close');
      close();
    });

    producer.on('close', () => {
      console.log('Closing producer');
      close();
    });

    producerLabel.set(type, producer.id);
  } catch
    (err) {
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

export const consume = async (producer_id, setMedia) => {
  const { consumer, stream, kind } = await getConsumeStream(producer_id)
  consumers.set(consumer.id, consumer);

  if (kind === 'video') {
    setMedia(prev => ({
      ...prev,
      remote: [ ...prev.remote, { id: consumer.id, video: stream } ]
    }));
  } else {
    setMedia(prev => ({
      ...prev,
      remote: [ ...prev.remote, { id: consumer.id, audio: stream } ]
    }));
  }

  consumer.on('trackended', () => removeConsumer(consumer.id));
  consumer.on('transportclose', () => removeConsumer(consumer.id));
}

export const closeProducer = (type, setMedia) => {
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
    setMedia(prev => {
      prev.local.forEach((item) => {
        if (item.id === producer_id)
          item.video.getTracks().forEach((track) => track.stop());
      });

      return {
        ...prev,
        local: [ ...prev.local.filter(item => item.id !== producer_id) ]
      }
    });
  }
}

export const isOpen = () => {
  return _isOpen;
}
