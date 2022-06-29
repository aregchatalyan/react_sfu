import React from 'react';
import './login.scss';

import RoomClient from '../../helpers/RoomClient';

const Login = ({ form, setForm, setShowForm, setRoom, socket }) => {
  const onFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onJoinRoom = () => {
    if (!form.room_id || !form.username) return;

    let rc = null;

    if (rc?.isOpen()) return console.log('Already connected to a room');

    rc = new RoomClient(
      'local-video',
      'remote-videos',
      'remote-audios',
      socket,
      form.room_id,
      form.username
    );

    setRoom(rc);

    setShowForm(false);
  }

  return (
    <div className="container">
      <div className="login">
        <input
          type="text"
          name="room_id"
          value={form.room_id}
          className="room-input"
          autoComplete="off"
          placeholder="Room"
          onChange={onFormChange}/>

        <input
          type="text"
          name="username"
          value={form.username}
          className="user-input"
          autoComplete="off"
          placeholder="User"
          onChange={onFormChange}/>

        <button onClick={onJoinRoom}>
          <div>
            <i className="fas fa-sign-in-alt"/>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Login;
