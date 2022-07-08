import React from 'react';
import './hall.scss';

import { onFullScreen } from '../../helpers/full-screen';

const Hall = ({ media: { local, remote } }) => (
  <div className="media">
    <div className="local-video">
        {local.map(({ id, video }) => (<video id={id} key={id} ref={(ref) => {
            if (ref) {
                ref.srcObject = video;
                ref.onclick = () => onFullScreen(ref);
            }
        }} autoPlay={true} muted={true} playsInline={true}/>))}
    </div>

    <div className="remote-videos">
      {remote.map(({ id, video }) => (<video id={id} key={id} ref={(ref) => {
        if (ref) {
          ref.srcObject = video;
          ref.onclick = () => onFullScreen(ref);
        }
      }} autoPlay={true} muted={true} playsInline={true}/>))}
    </div>

    <div className="remote-audios">
      {remote.map(({ id, audio }) => (<audio id={id} key={id} ref={(ref) => {
        if (ref) ref.srcObject = audio;
      }} autoPlay={true} playsInline={false}/>))}
    </div>
  </div>
);

export default Hall;
