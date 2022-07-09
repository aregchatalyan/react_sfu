import React from 'react';
import './hall.scss';

import { onFullScreen } from '../../helpers/full-screen';

const Hall = ({ media: { local, remote } }) => (
  <div className="media">
    <div className="local-videos">
      {local.map(({ id, video }) => {
        return video && <video key={id} ref={(ref) => {
          if (ref) {
            ref.srcObject = video;
            ref.onclick = () => onFullScreen(ref);
          }
        }} autoPlay={true} muted={true} playsInline={true}/>
      })}
    </div>

    <div className="remote-videos">
      {remote.map(({ id, video }) => {
        return video && <video key={id} ref={(ref) => {
          if (ref) {
            const count = remote.filter(item => item.video).length;
            ref.srcObject = video;
            ref.className = `videos_${count}`;
            ref.onclick = () => onFullScreen(ref);
          }
        }} autoPlay={true} muted={true} playsInline={true}/>
      })}
    </div>

    <div className="remote-audios">
      {remote.map(({ id, audio }) => {
        return audio && <audio key={id} ref={(ref) => {
          if (ref) ref.srcObject = audio;
        }} autoPlay={true} playsInline={true}/>
      })}
    </div>
  </div>
);


export default Hall;
