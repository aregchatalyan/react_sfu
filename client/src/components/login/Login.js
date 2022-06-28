import React from 'react';
import './login.scss';

const Login = ({ form, setForm }) => {
  const onFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="container">
      <div className="login">
        <input
          type="text"
          name='room_id'
          className="room-input"
          autoComplete='off'
          placeholder="Room"
          onChange={onFormChange}/>

        <input
          type="text"
          name='user_id'
          className="user-input"
          autoComplete='off'
          placeholder="User"
          onChange={onFormChange}/>

        <button>Sign in</button>
      </div>
    </div>
  );
};

export default Login;
