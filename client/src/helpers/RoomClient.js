import * as mediasoupClient from 'mediasoup-client';

import { MediaTypes, EventTypes } from '../services/constants';

let producer;

export default class RoomClient {
  constructor(localMediaEl, remoteVideoEl, remoteAudioEl, socket, room_id, name) {
    this.name = name;
    this.localMediaEl = localMediaEl;
    this.remoteVideoEl = remoteVideoEl;
    this.remoteAudioEl = remoteAudioEl;

    this.socket = socket;
    this.producerTransport = null;
    this.consumerTransport = null;
    this.device = null;

    this.isVideoOnFullScreen = false;

    this.consumers = new Map();
    this.producers = new Map();

    console.log('Mediasoup client', mediasoupClient);

    /**
     * map that contains a mediatype as key and producer_id as value
     */
    this.producerLabel = new Map();

    this._isOpen = false;
    this.eventListeners = new Map();

    Object.keys(EventTypes).forEach(function (evt) {
        this.eventListeners.set(evt, []);
      }.bind(this)
    );

    this.createRoom(room_id).then(async function () {
        await this.join(name, room_id);
        this.initSockets();
        this._isOpen = true;
      }.bind(this)
    );
  }

  ////////// INIT /////////

  async createRoom(room_id) {
    await this.socket
      .request('createRoom', {
        room_id
      })
      .catch((err) => {
        console.log('Create room error:', err);
      });
  }

  async join(name, room_id) {
    this.socket
      .request('join', {
        name,
        room_id
      })
      .then(async function (e) {
          console.log('Joined to room', e);
          const data = await this.socket.request('getRouterRtpCapabilities');
          let device = await this.loadDevice(data);
          this.device = device;
          await this.initTransports(device);
          this.socket.emit('getProducers');
        }.bind(this)
      )
      .catch((err) => {
        console.log('Join error:', err);
      });
  }

  async loadDevice(routerRtpCapabilities) {
    let device;
    try {
      device = new mediasoupClient.Device();
    } catch (error) {
      if (error.name === 'UnsupportedError') {
        console.error('Browser not supported');
        alert('Browser not supported');
      }
      console.error(error);
    }
    await device.load({
      routerRtpCapabilities
    });
    return device;
  }

  async initTransports(device) {
    // init producerTransport
    {
      const data = await this.socket.request('createWebRtcTransport', {
        forceTcp: false,
        rtpCapabilities: device.rtpCapabilities
      });

      if (data.error) {
        console.error(data.error);
        return;
      }

      this.producerTransport = device.createSendTransport(data);

      this.producerTransport.on('connect', async function ({ dtlsParameters }, callback, errback) {
          this.socket
            .request('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            })
            .then(callback)
            .catch(errback);
        }.bind(this)
      );

      this.producerTransport.on('produce', async function ({ kind, rtpParameters }, callback, errback) {
          try {
            const { producer_id } = await this.socket.request('produce', {
              producerTransportId: this.producerTransport.id,
              kind,
              rtpParameters
            });
            callback({
              id: producer_id
            });
          } catch (err) {
            errback(err);
          }
        }.bind(this)
      );

      this.producerTransport.on('connectionstatechange', function (state) {
          switch (state) {
            case 'connecting':
              break;

            case 'connected':
              //localVideo.srcObject = stream
              break;

            case 'failed':
              this.producerTransport.close();
              break;

            default:
              break;
          }
        }.bind(this)
      );
    }

    // init consumerTransport
    {
      const data = await this.socket.request('createWebRtcTransport', {
        forceTcp: false
      });

      if (data.error) {
        console.error(data.error);
        return;
      }

      // only one needed
      this.consumerTransport = device.createRecvTransport(data);
      this.consumerTransport.on('connect', function ({ dtlsParameters }, callback, errback) {
          this.socket
            .request('connectTransport', {
              transport_id: this.consumerTransport.id,
              dtlsParameters
            })
            .then(callback)
            .catch(errback);
        }.bind(this)
      );

      this.consumerTransport.on('connectionstatechange', async function (state) {
          switch (state) {
            case 'connecting':
              break;

            case 'connected':
              //remoteVideo.srcObject = await stream;
              //await socket.request('resume');
              break;

            case 'failed':
              this.consumerTransport.close();
              break;

            default:
              break;
          }
        }.bind(this)
      );
    }
  }

  initSockets() {
    this.socket.on('consumerClosed', function ({ consumer_id }) {
        console.log('Closing consumer:', consumer_id);
        this.removeConsumer(consumer_id);
      }.bind(this)
    );

    /**
     * data: [ {
     *  producer_id:
     *  producer_socket_id:
     * }]
     */
    this.socket.on('newProducers', async function (data) {
        console.log('New producers', data);
        for (let { producer_id } of data) {
          await this.consume(producer_id);
        }
      }.bind(this)
    );

    this.socket.on('disconnect', function () {
        this.exit(true);
      }.bind(this)
    );
  }

  //////// MAIN FUNCTIONS /////////////

  async produce(type, deviceId = null) {
    let mediaConstraints = {};
    let audio = false;
    let screen = false;
    switch (type) {
      case MediaTypes.audio:
        mediaConstraints = {
          audio: {
            deviceId: deviceId
          },
          video: false
        };
        audio = true;
        break;
      case MediaTypes.video:
        mediaConstraints = {
          audio: false,
          video: {
            width: {
              min: 640,
              ideal: 1280
            },
            height: {
              min: 480,
              ideal: 720
            },
            deviceId: deviceId,
            // aspectRatio: {
            //     ideal: 1.7777777778
            // }
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
    if (!this.device.canProduce('video') && !audio) {
      console.error('Cannot produce video');
      return;
    }
    if (this.producerLabel.has(type)) {
      console.log('Producer already exists for this type ' + type);
      return;
    }
    console.log('Mediacontraints:', mediaConstraints);
    let stream;
    try {
      stream = screen
        ? await navigator.mediaDevices.getDisplayMedia()
        : await navigator.mediaDevices.getUserMedia(mediaConstraints);
      console.log(navigator.mediaDevices.getSupportedConstraints());

      const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
      const params = {
        track
      };
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
      producer = await this.producerTransport.produce(params);

      console.log('Producer', producer);

      this.producers.set(producer.id, producer);

      let elem;
      if (!audio) {
        elem = document.createElement('video');
        elem.srcObject = stream;
        elem.id = producer.id;
        elem.setAttribute('playsinline', 'true');
        elem.setAttribute('autoplay', 'true');
        elem.setAttribute('muted', 'true');
        // elem.className = 'vid';
        console.log(elem, this.localMediaEl)
        const localVideoEl = document.getElementById(this.localMediaEl);
        localVideoEl.appendChild(elem);
        this.handleFS(elem.id);
      }

      producer.on('trackended', () => {
        this.closeProducer(type);
      });

      producer.on('transportclose', () => {
        console.log('Producer transport close');
        if (!audio) {
          elem.srcObject.getTracks().forEach(function (track) {
            track.stop();
          });
          elem.parentNode.removeChild(elem);
        }
        this.producers.delete(producer.id);
      });

      producer.on('close', () => {
        console.log('Closing producer');
        if (!audio) {
          elem.srcObject.getTracks().forEach(function (track) {
            track.stop();
          });
          elem.parentNode.removeChild(elem);
        }
        this.producers.delete(producer.id);
      });

      this.producerLabel.set(type, producer.id);

      switch (type) {
        case MediaTypes.audio:
          this.event(EventTypes.startAudio);
          break;
        case MediaTypes.video:
          this.event(EventTypes.startVideo);
          break;
        case MediaTypes.screen:
          this.event(EventTypes.startScreen);
          break;
        default:
          return;
      }
    } catch (err) {
      console.log('Produce error:', err);
    }
  }

  async consume(producer_id) {
    //let info = await this.roomInfo()

    this.getConsumeStream(producer_id).then(
      function ({ consumer, stream, kind }) {
        this.consumers.set(consumer.id, consumer);

        let elem;
        if (kind === 'video') {
          elem = document.createElement('video');
          elem.srcObject = stream;
          elem.id = consumer.id;
          elem.setAttribute('playsinline', 'true');
          elem.setAttribute('autoplay', 'true');
          elem.setAttribute('muted', 'true');
          elem.className = 'vid';
          this.remoteVideoEl.appendChild(elem);
          this.handleFS(elem.id);
        } else {
          elem = document.createElement('audio');
          elem.srcObject = stream;
          elem.id = consumer.id;
          elem.playsinline = false;
          elem.autoplay = true;
          this.remoteAudioEl.appendChild(elem);
        }

        consumer.on('trackended', function () {
            this.removeConsumer(consumer.id);
          }.bind(this)
        );

        consumer.on('transportclose', function () {
            this.removeConsumer(consumer.id);
          }.bind(this)
        );
      }.bind(this)
    );
  }

  async getConsumeStream(producerId) {
    const { rtpCapabilities } = this.device;
    const data = await this.socket.request('consume', {
      rtpCapabilities,
      consumerTransportId: this.consumerTransport.id, // might be
      producerId
    });
    const { id, kind, rtpParameters } = data;

    let codecOptions = {};
    const consumer = await this.consumerTransport.consume({
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

  closeProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type);
      return;
    }

    let producer_id = this.producerLabel.get(type);
    console.log('Close producer', producer_id);

    this.socket.emit('producerClosed', { producer_id });

    this.producers.get(producer_id).close();
    this.producers.delete(producer_id);
    this.producerLabel.delete(type);

    if (type !== MediaTypes.audio) {
      let elem = document.getElementById(producer_id);
      elem.srcObject.getTracks().forEach(function (track) {
        track.stop();
      });
      elem.parentNode.removeChild(elem);
    }

    switch (type) {
      case MediaTypes.audio:
        this.event(EventTypes.stopAudio);
        break;
      case MediaTypes.video:
        this.event(EventTypes.stopVideo);
        break;
      case MediaTypes.screen:
        this.event(EventTypes.stopScreen);
        break;
      default:
        return;
    }
  }

  removeConsumer(consumer_id) {
    let elem = document.getElementById(consumer_id);
    elem.srcObject.getTracks().forEach(function (track) {
      track.stop();
    });
    elem.parentNode.removeChild(elem);

    this.consumers.delete(consumer_id);
  }

  exit(offline = false) {
    let clean = function () {
      this._isOpen = false;
      this.consumerTransport.close();
      this.producerTransport.close();
      this.socket.off('disconnect');
      this.socket.off('newProducers');
      this.socket.off('consumerClosed');
    }.bind(this);

    if (!offline) {
      this.socket
        .request('exitRoom')
        .then((e) => console.log(e))
        .catch((e) => console.warn(e))
        .finally(
          function () {
            clean();
          }.bind(this)
        );
    } else {
      clean();
    }

    this.event(EventTypes.exitRoom);
  }

  ///////  HELPERS //////////

  // async roomInfo() {
  //     return await this.socket.request('getMyRoomInfo')
  // }

  static get mediaType() {
    return MediaTypes;
  }

  event(evt) {
    if (this.eventListeners.has(evt)) {
      this.eventListeners.get(evt).forEach((callback) => callback());
    }
  }

  on(evt, callback) {
    this.eventListeners.get(evt).push(callback);
  }

  //////// GETTERS ////////

  isOpen() {
    return this._isOpen;
  }

  static get EVENTS() {
    return EventTypes;
  }

  //////// UTILITY ////////

  handleFS(id) {
    let videoPlayer = document.getElementById(id);

    videoPlayer.addEventListener('fullscreenchange', () => {
      if (videoPlayer.controls) return;
      let fullscreenElement = document.fullscreenElement;
      if (!fullscreenElement) {
        videoPlayer.style.pointerEvents = 'auto';
        this.isVideoOnFullScreen = false;
      }
    });

    videoPlayer.addEventListener('webkitfullscreenchange', () => {
      if (videoPlayer.controls) return;
      let webkitIsFullScreen = document.webkitIsFullScreen;
      if (!webkitIsFullScreen) {
        videoPlayer.style.pointerEvents = 'auto';
        this.isVideoOnFullScreen = false;
      }
    });

    videoPlayer.addEventListener('click', async () => {
      if (videoPlayer.controls) return;
      if (!this.isVideoOnFullScreen) {
        if (videoPlayer.requestFullscreen) {
          await videoPlayer.requestFullscreen();
        } else if (videoPlayer.webkitRequestFullscreen) {
          videoPlayer.webkitRequestFullscreen();
        } else if (videoPlayer.msRequestFullscreen) {
          videoPlayer.msRequestFullscreen();
        }
        this.isVideoOnFullScreen = true;
        videoPlayer.style.pointerEvents = 'none';
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        this.isVideoOnFullScreen = false;
        videoPlayer.style.pointerEvents = 'auto';
      }
    });
  }
}