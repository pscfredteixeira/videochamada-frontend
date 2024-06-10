import React from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const Home = () => {
  const navigate = useNavigate();

  const createRoom = () => {
    const roomId = uuidv4();
    navigate(`/room/${roomId}`);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Bem-vindo ao Videochamada</h1>
      <button onClick={createRoom}>Criar Sala</button>
    </div>
  );
};

export default Home;
