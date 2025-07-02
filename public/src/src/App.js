import React, { useState, useEffect } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';

const App = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [callStatus, setCallStatus] = useState('Ready to call');
  const retellWebClient = new RetellWebClient();

  useEffect(() => {
    retellWebClient.on("call_started", () => {
      console.log("call started");
      setCallStatus('Call active');
      setIsCallActive(true);
    });

    retellWebClient.on("call_ended", () => {
      console.log("call ended");
      setCallStatus('Call ended');
      setIsCallActive(false);
    });

    retellWebClient.on("update", (update) => {
      console.log("update", update);
      if (update.transcript) {
        setTranscript(update.transcript);
      }
    });

    return () => {
      retellWebClient.removeAllListeners();
    };
  }, []);

  const startCall = async () => {
    try {
      setCallStatus('Creating call...');
      
      const response = await fetch('https://server-ten-delta-31.vercel.app/create-web-call', {
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

      await retellWebClient.startCall({
        accessToken: data.access_token,
        sampleRate: 24000,
        captureDeviceId: "default",
        playbackDeviceId: "default",
      });

      setCallStatus('Call starting...');
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus(`Error: ${error.message}`);
    }
  };

  const stopCall = async () => {
    try {
      await retellWebClient.stopCall();
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
          borderRadius: '5px'
        }}>
          {transcript || 'Transcript will appear here during the call...'}
        </div>
      </div>
    </div>
  );
};

export default App;
