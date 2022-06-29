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
  const [ form, setForm ] = useState({ room_id: '1', user_id: `user${Math.floor(Math.random() * 101)}` });

  return (
    <div>
      {showForm
        ? (<Login {...{ form, setForm, setShowForm, setRoom, socket }}/>)
        : (
          <RoomContext.Provider value={room}>
            <Control {...{ setShowForm }}/>
            <Hall {...{}}/>
          </RoomContext.Provider>
        )}
    </div>
  );
}

export default App;
