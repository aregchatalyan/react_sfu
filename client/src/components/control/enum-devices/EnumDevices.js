import React, { useCallback, useEffect, useRef, useState } from 'react';
import './enum-devices.scss';

const EnumDevices = ({ audioSelRef, videoSelRef, style }) => {
  const devicesRef = useRef([]);

  const [ isEnumDevices, setIsEnumDevices ] = useState(false);

  const initEnumDevices = useCallback(async () => {
    if (isEnumDevices) return;

    const constraints = { audio: true, video: true }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const devices = await navigator.mediaDevices.enumerateDevices();

      devices.forEach((device) => {
        if (device.kind === 'audioinput' || device.kind === 'videoinput') {
          devicesRef.current.push({
            type: device.kind,
            value: device.deviceId,
            label: device.label,
          });
        }

        setIsEnumDevices(true);
      });

      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.error('Access denied for audio/video: ', e);
    }
  }, [ isEnumDevices ]);

  useEffect(() => {
    initEnumDevices().then();
  }, [ initEnumDevices ]);

  return (
    <div className="enum-devices" style={ style }>
      <div>
        <div className="icon">
          <i className="fas fa-microphone"/>
        </div>

        <select id="audioSelect" ref={ audioSelRef } className="form-select">
          { devicesRef.current.map(({ type, value, label }) => (
            type === 'audioinput' && <option key={ label } value={ value }>{ label }</option>
          )) }
        </select>
      </div>

      <div>
        <div className="icon">
          <i className="fas fa-camera"/>
        </div>

        <select id="videoSelect" ref={ videoSelRef } className="form-select">
          { devicesRef.current.map(({ type, value, label }) => (
            type === 'videoinput' && <option key={ label } value={ value }>{ label }</option>
          )) }
        </select>
      </div>
    </div>
  );
};

export default EnumDevices;
