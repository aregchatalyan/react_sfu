import React, { useRef, useState } from 'react';
import './controll.scss';

import Button from './button/Button';
import EnumDevices from './enum-devices/EnumDevices';

import { MediaTypes } from '../../services/constants';

import { closeProducer, exit, produce } from '../../helpers/room-client';

const Control = ({ setForm, setMedia }) => {
  const audioSelRef = useRef(null);
  const videoSelRef = useRef(null);

  const [ showDevices, setShowDevices ] = useState(false);
  const [ onOff, setOnOff ] = useState({ mic: false, cam: false, screen: false });

  const onExit = async () => {
    await exit();
    setForm(prev => ({ ...prev, show: true }));
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
      ? produce(MediaTypes[type], device_id, setMedia)
      : closeProducer(MediaTypes[type], setMedia);
  }

  return (
    <div className="control">
      <Button
        colors={ { active: 'white', inactive: 'blue' } }
        icon={ 'sign-out-alt' }
        action={ onExit }/>

      <Button
        active={ showDevices }
        colors={ { active: 'white', inactive: 'blue' } }
        icon={ 'cogs' }
        action={ onShowDevices }/>

      <Button
        active={ onOff.mic }
        colors={ { active: 'white', inactive: 'blue' } }
        icon={ 'microphone' }
        action={ () => onOffDevice('mic', 'audio') }/>

      <Button
        active={ onOff.cam }
        colors={ { active: 'white', inactive: 'blue' } }
        icon={ 'camera' }
        action={ () => onOffDevice('cam', 'video') }/>

      <Button
        active={ onOff.screen }
        colors={ { active: 'white', inactive: 'blue' } }
        icon={ 'desktop' }
        action={ () => onOffDevice('screen', 'screen') }/>

      <EnumDevices { ...{ audioSelRef, videoSelRef } } style={ { display: showDevices ? 'block' : 'none' } }/>
    </div>
  );
};

export default Control;
