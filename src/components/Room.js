import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Room = () => {
  const { roomId } = useParams();
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const myVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setMyStream(stream);
        myVideoRef.current.srcObject = stream;

        socket.emit('join-room', roomId);

        socket.on('user-connected', userId => {
          console.log('User connected:', userId);
          // Implement WebRTC connection logic here
        });

        socket.on('call-made', async data => {
          const offer = data.offer;
          const peerConnection = new RTCPeerConnection();
          peerConnection.ontrack = event => {
            setRemoteStream(event.streams[0]);
            remoteVideoRef.current.srcObject = event.streams[0];
          };
          myStream.getTracks().forEach(track => peerConnection.addTrack(track, myStream));
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
          socket.emit('make-answer', { answer, roomId });
        });
      });

    return () => {
      socket.emit('leave-room', roomId);
    };
  }, [roomId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h2>Sala: {roomId}</h2>
      <video ref={myVideoRef} autoPlay muted style={{ width: '200px' }} />
      <video ref={remoteVideoRef} autoPlay style={{ width: '400px', marginTop: '20px' }} />
    </div>
  );
};

export default Room;
