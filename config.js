const os = require('os');
const fs = require('fs');
const path = require('path');

const faces = os.networkInterfaces();

const getLocalIp = () => {
  let localIp = '127.0.0.1';

  for (const { family, internal, address } of Object.values(faces).flat(1)) {
    if (family === 'IPv4' && !internal) {
      return localIp = address;
    }
  }

  return localIp;
}

module.exports = {
  listenIp: 'localhost',
  listenPort: 3030,
  sslCrt: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'), 'utf-8'),
  sslKey: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem'), 'utf-8'),

  mediasoup: {
    // Worker settings
    CPU: os.cpus(),
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'warn',
      logTags: [ 'info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp', 'rtx', 'bwe', 'score', 'simulcast', 'svc' ]
    },

    // Router settings
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000,
          parameters: {
            'profile-id': 2,
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000
          }
        }
      ]
    },

    // WebRtcTransport settings
    webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: process.env.NODE_ENV === 'production' // replace by client IP address
            ? '3.72.185.44'
            : getLocalIp()
        }
      ],
      maxIncomingBitrate: 1500000,
      initialAvailableOutgoingBitrate: 1000000
    }
  }
}
