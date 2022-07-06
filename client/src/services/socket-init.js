import { io } from 'socket.io-client';

import { API_URL } from './config';

export const socket = io(API_URL, {
  secure: true,
  transports: [ 'websocket', 'polling' ]
});

socket.on('connect_error', () => {
  socket.io.opts.transports = [ 'polling', 'websocket' ]
  socket.io.opts.upgrade = true
});

export const soc = (type, data = {}) => new Promise((resolve, reject) => {
  console.log('EMIT', type, data);

  socket.emit(type, data, (data) => {
    console.log('CALLBACK', type, data);

    data.error ? reject(data.error) : resolve(data);
  });
});
