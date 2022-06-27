const Room = require('./helpers/Room');
const Peer = require('./helpers/Peer');

const getMediasoupWorker = require('./mediasoupInit');

module.exports = (io) => {
  const roomList = new Map();

  io.on('connection', (socket) => {
    socket.on('createRoom', async ({ room_id }, callback) => {
      if (roomList.has(room_id)) return callback('already exists');

      console.log('Created room', { room_id: room_id });

      const worker = await getMediasoupWorker();

      roomList.set(room_id, new Room(room_id, worker, io));

      callback(room_id);
    });

    socket.on('join', ({ room_id, name }, cb) => {
      console.log('User joined', { room_id, name });

      if (!roomList.has(room_id)) return cb({ error: 'Room does not exist' });

      roomList.get(room_id).addPeer(new Peer(socket.id, name));

      socket.room_id = room_id;

      cb(roomList.get(room_id).toJson());
    });

    socket.on('getProducers', () => {
      if (!roomList.has(socket.room_id)) return;

      console.log('Get producers', { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

      // send all the current producer to newly joined member
      let producerList = roomList.get(socket.room_id).getProducerListForPeer();

      socket.emit('newProducers', producerList);
    });

    socket.on('getRouterRtpCapabilities', (_, callback) => {
      console.log('Get RouterRtpCapabilities', { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

      try {
        callback(roomList.get(socket.room_id).getRtpCapabilities());
      } catch (e) {
        callback({ error: e.message });
      }
    });

    socket.on('createWebRtcTransport', async (_, callback) => {
      console.log('Create webrtc transport', { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

      try {
        const { params } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id);

        callback(params);
      } catch (err) {
        console.error(err);
        callback({ error: err.message });
      }
    });

    socket.on('connectTransport', async ({ transport_id, dtlsParameters }, callback) => {
      console.log('Connect transport', { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

      if (!roomList.has(socket.room_id)) return;
      await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters);

      callback('success');
    });

    socket.on('produce', async ({ kind, rtpParameters, producerTransportId }, callback) => {
      if (!roomList.has(socket.room_id)) return callback({ error: 'not is a room' });

      let producer_id = await roomList.get(socket.room_id).produce(socket.id, producerTransportId, rtpParameters, kind);

      console.log('Produce', {
        type: `${kind}`,
        name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
        id: `${producer_id}`
      });

      callback({ producer_id });
    });

    socket.on('consume', async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
      //TODO null handling
      let params = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities);

      console.log('Consuming', {
        name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
        producer_id: `${producerId}`,
        consumer_id: `${params.id}`
      });

      callback(params);
    });

    socket.on('resume', async (data, callback) => {
      await consumer.resume();

      callback();
    });

    socket.on('getMyRoomInfo', (_, cb) => cb(roomList.get(socket.room_id).toJson()));

    socket.on('disconnect', async () => {
      console.log('Disconnect', { name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

      if (!socket.room_id) return;
      await roomList.get(socket.room_id).removePeer(socket.id);
    });

    socket.on('producerClosed', ({ producer_id }) => {
      console.log('Producer close', { name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

      roomList.get(socket.room_id).closeProducer(socket.id, producer_id);
    });

    socket.on('exitRoom', async (_, callback) => {
      console.log('Exit room', { name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

      if (!roomList.has(socket.room_id)) {
        callback({ error: 'not currently in a room' });
        return;
      }

      // close transports
      await roomList.get(socket.room_id).removePeer(socket.id);

      if (roomList.get(socket.room_id).getPeers().size === 0) {
        roomList.delete(socket.room_id);
      }

      socket.room_id = null;

      callback('successfully exited room');
    });
  });
};