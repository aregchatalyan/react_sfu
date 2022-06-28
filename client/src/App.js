import React, { useCallback, useState } from 'react';

import Login from './components/login/Login';
import Control from './components/control/Control';
import EnumDevices from './components/control/enum-devices/EnumDevices';

const App = () => {
  const [ form, setForm ] = useState({ room_id: '', user_id: '' });

  const socket = useCallback(() => {

  }, []);
  
  return (
    <div>
      <Login {...{ form, setForm }}/>
      <Control/>
      <EnumDevices/>
    </div>
  );
}

export default App;
