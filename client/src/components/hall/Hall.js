import React from 'react';
import './hall.scss';

import { socket } from '../../services/socket-init';

import { onFullScreen } from '../../helpers/full-screen';

const Hall = ({ media: { local, remote } }) => {
  socket.on('layout', () => {
    const layout = window.sessionStorage.getItem('layout');
    console.log('layout', layout);
  });

  return (
    <div id="media">
      <div id="local-video">
        {local.video && <video id={local.id} key={local.id} ref={ref => {
          if (ref) ref.srcObject = local.video;
        }} autoPlay={true} muted={true} playsInline={true} onClick={() => onFullScreen(local.id)}/>}
      </div>

      <div id="remote-videos">
        {remote.map((item) => (<video id={item.id} key={item.id} ref={ref => {
          if (ref) ref.srcObject = item.video;
        }} autoPlay={true} muted={true} playsInline={true} onClick={() => onFullScreen(item.id)}/>))}
      </div>

      <div id="remote-audios">
        {remote.map((item) => (<audio id={item.id} key={item.id} ref={ref => {
          if (ref) ref.srcObject = item.audio;
        }} autoPlay={true} playsInline={false}/>))}
      </div>
    </div>
  );
};

export default Hall;
