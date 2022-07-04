import React from 'react';
import './hall.scss';

import { socket } from '../../services/socket-init';

const Hall = () => {

  socket.on('layout', () => {
    const layout = window.sessionStorage.getItem('layout');
    console.log('layout', layout);
  })

  return (
    <div id="media">
      <div id="local-video"></div>
      <div id="remote-videos"></div>
      <div id="remote-audios"></div>
    </div>
  );
};

export default Hall;
