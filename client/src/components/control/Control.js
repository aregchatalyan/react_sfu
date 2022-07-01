import React, { useContext, useRef, useState } from 'react';
import './controll.scss';

import Button from './button/Button';
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
      <Button
        // active={undefined}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'sign-out-alt'}
        action={onExit}/>

      <Button
        active={onOff.devices}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'cogs'}
        action={onDevices}/>

      <Button
        active={onOff.mic}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'microphone'}
        action={onMicrophone}/>

      <Button
        active={onOff.cam}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'camera'}
        action={onCamera}/>

      <Button
        active={onOff.desk}
        colors={{ active: 'white', inactive: 'blue' }}
        icon={'desktop'}
        action={onDesktop}/>

      <EnumDevices {...{ audioSelRef, videoSelRef }} style={{ display: showDevices ? 'block' : 'none' }}/>
    </div>
  );
};

export default Control;
