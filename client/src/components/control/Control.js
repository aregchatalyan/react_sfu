import React, { useEffect, useRef, useState } from 'react';
import './controll.scss';

import Button from './button/Button';
import EnumDevices from './enum-devices/EnumDevices';

import { MediaTypes } from '../../services/constants';

import { exit, produce, closeProducer } from '../../helpers/room-client';

const Control = ({ setShowForm, media, setMedia }) => {
  const micRef = useRef(null);
  const camRef = useRef(null);
  const screenRef = useRef(null);
  const audioSelRef = useRef(null);
  const videoSelRef = useRef(null);

  const [ showDevices, setShowDevices ] = useState(false);
  const [ onOff, setOnOff ] = useState({ mic: false, cam: false, screen: false });

  useEffect(() => {
    camRef.current.click();
  }, []);

  const onExit = async () => {
    await exit();
    setShowForm(true);
  }

  const onShowDevices = () => {
    setShowDevices(!showDevices);
  }

  const onOffDevice = (device_name, type) => {
    setOnOff(prev => ({ ...prev, [device_name]: !prev[device_name] }));

    const device_id = (type === 'audio')
      ? audioSelRef.current.value
      : videoSelRef.current.value;

    !onOff[device_name]
      ? produce(MediaTypes[type], device_id, media, setMedia)
      : closeProducer(MediaTypes[type], device_id, media, setMedia);
  }

  return (
    <div className="control">
      <Button
        // active={undefined}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'sign-out-alt'}
        action={onExit}/>

      <Button
        active={showDevices}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'cogs'}
        action={() => onShowDevices()}/>

      <Button
        ref={micRef}
        active={onOff.mic}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'microphone'}
        action={() => onOffDevice('mic', 'audio')}/>

      <Button
        ref={camRef}
        active={onOff.cam}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'camera'}
        action={() => onOffDevice('cam', 'video')}/>

      <Button
        ref={screenRef}
        active={onOff.screen}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'desktop'}
        action={() => onOffDevice('screen', 'screen')}/>

      <EnumDevices {...{ audioSelRef, videoSelRef }} style={{ display: showDevices ? 'block' : 'none' }}/>
    </div>
  );
};

export default Control;
