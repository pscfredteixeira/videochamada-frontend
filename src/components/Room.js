import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('https://your-backend-url.vercel.app');

const Room = () => {
  const { roomId } = useParams();
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  const myVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);
      myVideoRef.current.srcObject = stream;

      socket.emit('join-room', roomId);

      const pc = new RTCPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = event => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = event => {
        if (event.candidate) {
          socket.emit('candidate', { candidate: event.candidate, roomId });
        }
      };

      socket.on('offer', async payload => {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(new RTCSessionDescription(answer));
        socket.emit('answer', { sdp: answer, roomId });
      });

      socket.on('answer', async payload => {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      });

      socket.on('candidate', async payload => {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      });

      setPeerConnection(pc);

      if (stream) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(new RTCSessionDescription(offer));
        socket.emit('offer', { sdp: offer, roomId });
      }
    };

    init();

    return () => {
      socket.emit('leave-room', roomId);
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [roomId, peerConnection]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h2>Sala: {roomId}</h2>
      <video ref={myVideoRef} autoPlay muted style={{ width: '200px' }} />
      <video ref={remoteVideoRef} autoPlay style={{ width: '400px', marginTop: '20px' }} />
    </div>
  );
};

export default Room;
