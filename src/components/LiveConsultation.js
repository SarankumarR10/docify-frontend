import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Peer from 'simple-peer';
import axios from 'axios';
import './LiveConsultation.css';

function LiveConsultation() {
  const { consultationId } = useParams();
  const [connected, setConnected] = useState(false);
  const [patientOnline, setPatientOnline] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [recording, setRecording] = useState(false);

  const stompClientRef = useRef(null);
  const peerRef = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const chatBoxRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const presenceIntervalRef = useRef(null);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClientRef.current = client;
        setConnected(true);
        client.subscribe(`/topic/signal/${consultationId}`, handleSignal);
        client.subscribe(`/topic/chat/${consultationId}`, handleChat);
        client.subscribe(`/topic/presence/${consultationId}`, handlePresence);
        publishPresence('online');
        presenceIntervalRef.current = setInterval(() => publishPresence('online'), 10000);
      },
      onStompError: frame => console.error('STOMP error:', frame),
    });

    client.activate();

    axios.get(`http://localhost:8080/api/chat/${consultationId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error('Chat load error', err));

    const handleUnload = () => publishPresence('offline');
    const handleVisibility = () => publishPresence(document.visibilityState === 'visible' ? 'online' : 'offline');

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      handleUnload();
      clearInterval(presenceIntervalRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      client.deactivate();
      stopTimer();
    };
  }, [consultationId]);

  const safePublish = (destination, body) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({ destination, body });
    }
  };

  const publishPresence = (status) => {
    safePublish(`/app/presence/${consultationId}`, JSON.stringify({ userType: 'doctor', status }));
  };

  const handlePresence = (msg) => {
    const { userType, status } = JSON.parse(msg.body);
    if (userType === 'patient') setPatientOnline(status === 'online');
  };

  const handleSignal = (message) => {
    const data = JSON.parse(message.body);
    if (data.type === 'answer' || data.type === 'candidate') {
      peerRef.current?.signal(data.signal);
    }
  };

  const handleChat = (message) => {
    const chat = JSON.parse(message.body);
    setMessages(prev => [...prev, chat]);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  const stopTimer = () => clearInterval(timerRef.current);

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.current.srcObject = stream;

    const peer = new Peer({ initiator: true, trickle: false, stream });
    peerRef.current = peer;

    peer.on('signal', signalData => {
      safePublish(`/app/signal/${consultationId}`, JSON.stringify({
        type: signalData.type === 'offer' ? 'offer' : 'candidate',
        signal: signalData,
      }));
    });

    peer.on('stream', remoteStream => {
      remoteVideo.current.srcObject = remoteStream;
    });

    peer.on('close', () => {
      alert('Patient disconnected');
      endCall();
    });

    peer.on('error', err => console.error('Peer error:', err));

    setCallStarted(true);
    startTimer();
  };

  const endCall = () => {
    peerRef.current?.destroy();
    recorderRef.current?.stop();
    setRecording(false);
    stopTimer();
    setCallStarted(false);

    if (localVideo.current?.srcObject) {
      localVideo.current.srcObject.getTracks().forEach(track => track.stop());
      localVideo.current.srcObject = null;
    }

    remoteVideo.current.srcObject = null;
  };

  const toggleMedia = (type) => {
    const tracks = localVideo.current?.srcObject?.getTracks();
    if (!tracks) return;
    tracks.forEach(track => {
      if (track.kind === type) track.enabled = !track.enabled;
    });
    if (type === 'audio') setAudioEnabled(prev => !prev);
    if (type === 'video') setVideoEnabled(prev => !prev);
  };

  const toggleRecording = () => {
    const stream = localVideo.current?.srcObject;
    if (!stream) return;

    if (!recording) {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = e => recordedChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Consultation_${consultationId}.webm`;
        a.click();
      };
      recorder.start();
      recorderRef.current = recorder;
    } else {
      recorderRef.current?.stop();
    }

    setRecording(prev => !prev);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSizeMB = 10;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB.`);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      safePublish(`/app/chat/${consultationId}`, JSON.stringify({
        sender: "Doctor",
        content: reader.result,
        fileName: file.name,
        fileType: file.type,
        isFile: true,
        timestamp: new Date().toISOString(),
      }));
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const chat = {
      sender: "Doctor",
      content: messageInput.trim(),
      isFile: false,
      timestamp: new Date().toISOString(),
    };

    safePublish(`/app/chat/${consultationId}`, JSON.stringify(chat));
    setMessages(prev => [...prev, chat]);
    setMessageInput('');
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const renderFileMessage = (m) => (
    <div className="file-card">
      <div className="file-info">
        <strong>{m.fileName || 'Document'}</strong>
        <div className="file-meta">{m.fileType}</div>
      </div>
      <div className="file-buttons">
        <a href={m.content} download={m.fileName} className="btn-glass">⬇️ Save</a>
        <a href={m.content} target="_blank" rel="noopener noreferrer" className="btn-glass">👁 Open</a>
      </div>
    </div>
  );

  return (
    <div className="live-container">
      <h2>👨‍⚕️ Doctor - Live Consultation</h2>

      <div className="status-bar">
        <span>{patientOnline ? '🟢 Patient Online' : '🔴 Patient Offline'}</span>
      </div>

      <div className="video-box">
        <video ref={localVideo} autoPlay muted />
        <video ref={remoteVideo} autoPlay />
        {callStarted && (
          <div className="timer">
            ⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {!callStarted && (
        <>
          <button className="start-call-btn" onClick={startCall} disabled={!connected}>
            📞 Start Call
          </button>

        </>
      )}

      {callStarted && (
        <div className="controls">
          <button className="start-call-btn" onClick={endCall}>⏹ End Call</button>
          <button className="start-call-btn" onClick={() => toggleMedia('audio')}>
            {audioEnabled ? '🔇 Mute' : '🔊 Unmute'}
          </button>
          <button className="start-call-btn" onClick={() => toggleMedia('video')}>
            {videoEnabled ? '📵 Video Off' : '🎥 Video On'}
          </button>
          <button className="start-call-btn" onClick={toggleRecording}>
            {recording ? '⏹ Stop Recording' : '⏺ Start Recording'}
          </button>
        </div>
      )}

      <div className="chat-box">
        <h4>💬 Chat</h4>
        <div className="messages" ref={chatBoxRef}>
          {messages.map((m, i) => (
            <div key={i} className={`message-bubble ${m.sender === 'Doctor' ? 'sent' : 'received'}`}>
              <div className="message-content">
                <div className="sender-label">
                  {m.sender === 'Doctor' ? '👨‍⚕️ Doctor' : m.sender}
                </div>
                {m.isFile ? renderFileMessage(m) : <span>{m.content}</span>}
                <div className="timestamp">{new Date(m.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="input-row">
          <input
            type="text"
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            placeholder="Type your message..."
          />
          <input type="file" id="fileInput" style={{ display: 'none' }} onChange={handleFileUpload} />
          <label htmlFor="fileInput" className="start-call-btn" style={{ marginLeft: '8px', cursor: 'pointer' }}>
            📎 Share File
          </label>
          <button onClick={sendMessage} className="start-call-btn" style={{ marginLeft: '8px' }}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default LiveConsultation;
