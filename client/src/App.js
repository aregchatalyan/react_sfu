import React, { useState } from 'react';

import Hall from './components/hall/Hall';
import Login from './components/login/Login';
import Control from './components/control/Control';

const App = () => {
  const [ showForm, setShowForm ] = useState(true);
  const [ media, setMedia ] = useState({ local: { id: null, video: null }, remote: [] });
  const [ form, setForm ] = useState({ room_id: '1', username: `user${Math.floor(Math.random() * 101)}` });

  return (
    <div>
      {showForm
        ? (<Login {...{ form, setForm, setShowForm, media, setMedia }}/>)
        : (<>
            <Control {...{ setShowForm, media, setMedia }}/>
            <Hall {...{ media }}/>
          </>
        )}
    </div>
  );
}

export default App;
