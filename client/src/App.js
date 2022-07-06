import React, { useState } from 'react';

import Hall from './components/hall/Hall';
import Login from './components/login/Login';
import Control from './components/control/Control';

const App = () => {
  const [ media, setMedia ] = useState({
    local: [],
    remote: []
  });
  const [ form, setForm ] = useState({
    room_id: '1',
    username: `user${Math.floor(Math.random() * 101)}`,
    show: true
  });

  return (
    <div>
      {form.show
        ? (<Login {...{ form, setForm, setMedia }}/>)
        : (<>
            <Control {...{ setForm, setMedia }}/>
            <Hall {...{ media }}/>
          </>
        )}
    </div>
  );
}

export default App;
