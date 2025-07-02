'use client';

import React, { useState, useEffect } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [callStatus, setCallStatus] = useState('Ready to call');
  const [retellWebClient, setRetellWebClient] = useState(null);

  useEffect(() => {
    // Initialize the client
    const client = new RetellWebClient();
    setRetellWebClient(client);

    client.on("call_started", () => {
      console.log("call started");
      setCallStatus('Call active - Say something!');
      setIsCallActive(true);
    });

    client.on("call_ended", () => {
      console.log("call ended");
      setCallStatus('Call ended');
      setIsCallActive(false);
    });

    client.on("agent_start_talking", () => {
      console.log("agent started talking");
    });

    client.on("agent_stop_talking", () => {
      console.log("agent stopped talking");
    });

    client.on("update", (update) => {
      console.log("Received update:", update);
      
      // Handle different transcript formats
      let transcriptText = '';
      if (update.transcript) {
        if (typeof update.transcript === 'string') {
          transcriptText = update.transcript;
        } else if (Array.isArray(update.transcript)) {
          transcriptText = update.transcript
            .map(item => `${item.role === 'agent' ? 'Agent' : 'You'}: ${item.content}`)
            .join('\n');
        }
        setTranscript(transcriptText);
      }
    });

    client.on("error", (error) => {
      console.error("Retell error:", error);
      setCallStatus(`Error: ${error.message || 'Unknown error'}`);
    });

    return () => {
      client.removeAllListeners();
    };
  }, []);

  const startCall = async () => {
    try {
      setCallStatus('Requesting microphone access...');
      
      // Force microphone permission request
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      
      setCallStatus('Creating call...');
      
      const response = await fetch(`https://server-ten-delta-31.vercel.app/create-web-call?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      
      if (!data.success || !data.access_token) {
        throw new Error(data.error || 'Failed to get access token');
      }

      if (retellWebClient) {
        await retellWebClient.startCall({
          accessToken: data.access_token,
          sampleRate: 24000,
          captureDeviceId: "default",
          playbackDeviceId: "default"
        });
      }

      setCallStatus('Call starting...');
    } catch (error) {
      console.error('Error starting call:', error);
      if (error.name === 'NotAllowedError') {
        setCallStatus('Microphone access denied. Please allow microphone access and try again.');
      } else {
        setCallStatus(`Error: ${error.message}`);
      }
    }
  };

  const stopCall = async () => {
    try {
      if (retellWebClient) {
        await retellWebClient.stopCall();
      }
      setCallStatus('Call stopped');
      setIsCallActive(false);
    } catch (error) {
      console.error('Error stopping call:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Real-Time AI Voice Assistant</h1>
      <p>Experience live conversation with visual audio feedback</p>
      
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={isCallActive ? stopCall : startCall}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: isCallActive ? '#ff4444' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isCallActive ? 'End Call' : 'Start Call'}
        </button>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h3>Status: {callStatus}</h3>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h3>Live Transcript</h3>
        <div style={{
          border: '1px solid #ccc',
          padding: '15px',
          minHeight: '200px',
          backgroundColor: '#f9f9f9',
          borderRadius: '5px',
          whiteSpace: 'pre-wrap'
        }}>
          {transcript || 'Transcript will appear here during the call...'}
        </div>
      </div>
    </div>
  );
}
