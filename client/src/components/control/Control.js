import React, { useContext, useRef, useState } from 'react';
import './controll.scss';

import EnumDevices from './enum-devices/EnumDevices';

import { MediaTypes } from '../../services/constants';
import { RoomContext } from '../../context/RoomContext';

const Control = ({ setShowForm }) => {
  const audioSelRef = useRef(null);
  const videoSelRef = useRef(null);

  const roomContext = useContext(RoomContext);

  const [ showDevices, setShowDevices ] = useState(false);
  const [ onOff, setOnOff ] = useState({ devices: false, mic: false, cam: false, desk: false });

  const onExit = () => {
    setShowForm(true);
    roomContext.exit()
  }

  const onDevices = () => {
    setShowDevices(!showDevices);
    setOnOff({ ...onOff, devices: !onOff.devices });
  }

  const onMicrophone = () => {
    setOnOff({ ...onOff, mic: !onOff.mic });
    onOff.mic
      ? roomContext.closeProducer(MediaTypes.audio, audioSelRef.current.value)
      : roomContext.produce(MediaTypes.audio, audioSelRef.current.value);
  }

  const onCamera = () => {
    setOnOff({ ...onOff, cam: !onOff.cam });
    onOff.cam
      ? roomContext.closeProducer(MediaTypes.video, videoSelRef.current.value)
      : roomContext.produce(MediaTypes.video, videoSelRef.current.value);
  }

  const onDesktop = () => {
    setOnOff({ ...onOff, desk: !onOff.desk });
    onOff.desk
      ? roomContext.closeProducer(MediaTypes.screen)
      : roomContext.produce(MediaTypes.screen);
  }

  return (
    <div className="control">
      <button style={{ backgroundColor: 'black' }} onClick={onExit}>
        <div>
          <i style={{ color: 'white' }} className="fas fa-sign-out-alt"/>
        </div>
      </button>

      <button style={{ backgroundColor: onOff.devices ? 'white' : 'red' }} onClick={onDevices}>
        <div>
          <i className="fas fa-cogs"/>
        </div>
      </button>

      <button style={{ backgroundColor: onOff.mic ? 'white' : 'red' }} onClick={onMicrophone}>
        <div>
          <i className="fas fa-microphone"/>
        </div>

      </button>

      <button style={{ backgroundColor: onOff.cam ? 'white' : 'red' }} onClick={onCamera}>
        <div>
          <i className="fas fa-camera"/>
        </div>
      </button>

      <button style={{ backgroundColor: onOff.desk ? 'white' : 'red' }} onClick={onDesktop}>
        <div>
          <i className="fas fa-desktop"/>
        </div>
      </button>

      <EnumDevices {...{audioSelRef, videoSelRef}} style={{ display: showDevices ? 'block' : 'none' }}/>
    </div>
  );
};

export default Control;
