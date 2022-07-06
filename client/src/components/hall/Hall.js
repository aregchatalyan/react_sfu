import React from 'react';
import './hall.scss';

import { onFullScreen } from '../../helpers/full-screen';

const Hall = ({ media: { local, remote } }) => (
  <div className="media">
    <div className="local-video">
        {local.map((item) => (<video id={item.id} key={item.id} ref={(ref) => {
            if (ref) {
                ref.srcObject = item.video;
                ref.onclick = async () => await onFullScreen(ref);
            }
        }} autoPlay={true} muted={true} playsInline={true}/>))}
    </div>

    <div className="remote-videos">
      {remote.map((item) => (<video id={item.id} key={item.id} ref={(ref) => {
        if (ref) {
          ref.srcObject = item.video;
          ref.onclick = async () => await onFullScreen(ref);
        }
      }} autoPlay={true} muted={true} playsInline={true}/>))}
    </div>

    <div className="remote-audios">
      {remote.map((item) => (<audio id={item.id} key={item.id} ref={(ref) => {
        if (ref) ref.srcObject = item.audio;
      }} autoPlay={true} playsInline={false}/>))}
    </div>
  </div>
);

export default Hall;
