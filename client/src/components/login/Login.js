import React from 'react';
import './login.scss';

import { createRoom, isOpen } from '../../helpers/room-client';

const Login = ({ form, setForm, setMedia }) => {
  const onFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onJoinRoom = async () => {
    if (!form.room_id || !form.username) return;
    if (isOpen()) return console.log('Already connected to a room');

    await createRoom(form.room_id, form.username, setMedia);

    setForm({ ...form, show: false });
  }

  return (
    <div className="container">
      <div className="login">
        <input
          type="text"
          name="room_id"
          value={ form.room_id }
          className="room-input"
          autoComplete="off"
          placeholder="Room"
          onChange={ onFormChange }/>

        <input
          type="text"
          name="username"
          value={ form.username }
          className="user-input"
          autoComplete="off"
          placeholder="User"
          onChange={ onFormChange }/>

        <button onClick={ onJoinRoom }>
          <div><i className="fas fa-sign-in-alt"/></div>
        </button>
      </div>
    </div>
  );
};

export default Login;
