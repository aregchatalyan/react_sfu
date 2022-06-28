import React, { useState } from 'react';
import { io } from 'socket.io-client';

import Login from './components/login/Login';
import Control from './components/control/Control';
import Hall from './components/hall/Hall';

import { API_URL } from './services/config';

import { RoomContext } from './context/RoomContext';

const socket = io(API_URL, {
  secure: true,
  transports: [ 'websocket', 'polling' ]
})

socket.on('connect_error', () => {
  socket.io.opts.transports = [ 'polling', 'websocket' ]
  socket.io.opts.upgrade = true
});

socket.request = (type, data = {}) => new Promise((resolve, reject) => {
  console.log('EMIT', type, data);

  socket.emit(type, data, (data) => {
    console.log('CALLBACK', type, data);

    data.error ? reject(data.error) : resolve(data);
  });
});

const App = () => {
  const [ room, setRoom ] = useState({});
  const [ showForm, setShowForm ] = useState(true);
  const [ form, setForm ] = useState({ room_id: '', user_id: '' });

  return (
    <div>
      {showForm && <Login {...{ form, setForm, setShowForm, socket, setRoom }}/>}

      <RoomContext.Provider value={room}>
        {!showForm && <Control {...{ setShowForm }}/>}
        {!showForm && <Hall {...{}}/>}
      </RoomContext.Provider>
    </div>
  );
}

export default App;
