import React, { useContext, useState } from 'react';
import './controll.scss';

import EnumDevices from './enum-devices/EnumDevices';

import { RoomContext } from '../../context/RoomContext';

const Control = ({ setShowForm }) => {
  const roomContext = useContext(RoomContext);

  const [ showDevices, setShowDevices ] = useState(false);
  const [ onOff, setOnOff ] = useState({ devices: false, mic: false, cam: false, desk: false });

  const onExit = () => {
    setShowForm(true);
  }

  const onDevices = () => {
    setShowDevices(!showDevices);
    setOnOff({ ...onOff, devices: !onOff.devices });
  }

  const onMicrophone = () => {
    setOnOff({ ...onOff, mic: !onOff.mic });
    roomContext.produce('audioType', 'default')
  }

  const onCamera = () => {
    setOnOff({ ...onOff, cam: !onOff.cam });
    roomContext.produce('videoType', '898c5d7abe1d8efde91eaa915cf64624faf364c41600d04b52e97b3c4a991d8a')
  }

  const onDesktop = () => {
    setOnOff({ ...onOff, desk: !onOff.desk });
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

      {showDevices && <EnumDevices/>}
    </div>
  );
};

export default Control;
