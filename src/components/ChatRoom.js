import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import './ChatRoom.css';

function ChatRoom() {
  const { consultationId } = useParams(); // URL should include /chat/:consultationId
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [senderName, setSenderName] = useState('');
  const stompClientRef = useRef(null);
  const messageEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.name) {
      setSenderName(user.name);
    }

    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ Connected to chat WebSocket');
        client.subscribe(`/topic/chat/${consultationId}`, onMessageReceived);
        stompClientRef.current = client;
        setConnected(true);
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
      }
    });

    client.activate();

    // Load existing messages from DB
    axios.get(`http://localhost:8080/api/chat/${consultationId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error('Failed to load chat history:', err));

    return () => {
      client.deactivate();
    };
  }, [consultationId]);

  const onMessageReceived = (message) => {
    const msg = JSON.parse(message.body);
    setMessages(prev => [...prev, msg]);
  };

  const sendMessage = () => {
    if (!input.trim() || !stompClientRef.current) return;

    const msg = {
      sender: senderName,
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    stompClientRef.current.publish({
      destination: `/app/chat/${consultationId}`,
      body: JSON.stringify(msg)
    });

    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  return (
    <div className="chatroom-container">
      <h2>💬 Private Chat</h2>
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender === senderName ? 'own' : 'other'}`}>
            <strong>{msg.sender}</strong>: {msg.content}
            <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messageEndRef}></div>
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} disabled={!connected}>Send</button>
      </div>
    </div>
  );
}

export default ChatRoom;
