import React, { useContext, useRef, useState } from 'react';
import './controll.scss';

import EnumDevices from './enum-devices/EnumDevices';

import { MediaTypes } from '../../services/constants';
import { RoomContext } from '../../context/RoomContext';

const Button = ({ active = undefined, color = undefined, icon, action }) => (
  <button style={{ backgroundColor: active === undefined ? 'black' : active ? 'white' : 'red' }} onClick={action}>
    <div><i style={{ color: color === undefined ? '' : 'white' }} className={`fas fa-${icon}`}/></div>
  </button>
);

const Control = ({ setShowForm }) => {
  const audioSelRef = useRef(null);
  const videoSelRef = useRef(null);

  const roomContext = useContext(RoomContext);

  const [ showDevices, setShowDevices ] = useState(false);
  const [ onOff, setOnOff ] = useState({ devices: false, mic: false, cam: false, desk: false });

  const onExit = () => {
    setShowForm(true);
    roomContext.exit();
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
      <Button color={'white'} icon={'sign-out-alt'} action={onExit}/>

      <Button active={onOff.devices} icon={'cogs'} action={onDevices}/>
      <Button active={onOff.mic} icon={'microphone'} action={onMicrophone}/>
      <Button active={onOff.cam} icon={'camera'} action={onCamera}/>
      <Button active={onOff.desk} icon={'desktop'} action={onDesktop}/>

      <EnumDevices {...{ audioSelRef, videoSelRef }} style={{ display: showDevices ? 'block' : 'none' }}/>
    </div>
  );
};

export default Control;
