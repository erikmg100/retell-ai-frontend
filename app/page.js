'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [callStatus, setCallStatus] = useState('Ready to call');
  const [retellWebClient, setRetellWebClient] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const transcriptRef = useRef(null);

  useEffect(() => {
    // Check if mobile after component mounts
    setIsMobile(window.innerWidth <= 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
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
      
      let transcriptText = '';
      if (update.transcript) {
        if (typeof update.transcript === 'string') {
          transcriptText = update.transcript;
        } else if (Array.isArray(update.transcript)) {
          transcriptText = update.transcript
            .map(item => `${item.role === 'agent' ? '👩 Emma' : '👤 You'}: ${item.content}`)
            .join('\n\n');
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
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const startCall = async () => {
    try {
      setCallStatus('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
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
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '20px'
      }}>
        {/* Logo positioned right above main content */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px',
          zIndex: 1000
        }}>
          <img 
            src="https://cdn-ilclclp.nitrocdn.com/uiuLNoPKqvsktnRsIDyDgFJzxCWoSfSE/assets/images/optimized/rev-1557504/protectingpatientrights.com/wp-content/uploads/2024/11/white-logo-1-1.webp"
            alt="Logo"
            style={{
              height: isMobile ? '50px' : '70px',
              width: 'auto',
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
              maxWidth: '90%'
            }}
            onError={(e) => {
              console.log('Logo failed to load');
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          gap: '40px',
          maxWidth: '1200px',
          width: '100%',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* Audio Sphere Section */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div 
              onClick={isCallActive ? stopCall : startCall}
              style={{
                width: isMobile ? '150px' : '200px',
                height: isMobile ? '150px' : '200px',
                background: 'radial-gradient(circle at 30%, #ff6bcb, #00f7ff)',
                borderRadius: '50%',
                position: 'relative',
                boxShadow: isCallActive 
                  ? '0 0 60px rgba(0, 255, 255, 0.8), 0 0 120px rgba(255, 107, 203, 0.6)'
                  : '0 0 40px rgba(0, 255, 255, 0.5), 0 0 80px rgba(255, 107, 203, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '2rem' : '3rem',
                animation: isCallActive 
                  ? 'pulse 1s infinite ease-in-out' 
                  : 'pulse 2s infinite ease-in-out'
              }}
            >
              🎤
            </div>

            <button 
              onClick={isCallActive ? stopCall : startCall}
              style={{
                marginTop: '30px',
                padding: '15px 40px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#ffffff',
                background: isCallActive 
                  ? 'linear-gradient(45deg, #ff4757, #ff3742)'
                  : 'linear-gradient(45deg, #ff6bcb, #00f7ff)',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isCallActive
                  ? '0 4px 15px rgba(255, 71, 87, 0.4)'
                  : '0 4px 15px rgba(0, 255, 255, 0.4)',
                fontFamily: "inherit"
              }}
            >
              {isCallActive ? 'End Call' : 'Start Call'}
            </button>

            <div style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#00f7ff',
              textAlign: 'center',
              minWidth: '200px'
            }}>
              {callStatus}
            </div>
          </div>

          {/* Transcript Section */}
          <div style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '20px',
            maxHeight: isMobile ? '300px' : '400px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#00f7ff',
              flexShrink: 0
            }}>
              Live Transcript
            </h2>
            
            <div 
              ref={transcriptRef}
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#ffffff',
                fontWeight: '500',
                whiteSpace: 'pre-wrap',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '10px',
                scrollBehavior: 'smooth'
              }}
            >
              {transcript || (
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontStyle: 'italic',
                  fontWeight: '400',
                  textAlign: 'center',
                  marginTop: '50px'
                }}>
                  Your conversation will appear here in real-time...
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.1);
              opacity: 1;
            }
          }
          
          /* Custom scrollbar for transcript */
          div::-webkit-scrollbar {
            width: 8px;
          }
          
          div::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: #00f7ff;
            border-radius: 10px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: #0099cc;
          }
        `}</style>
      </div>
    </>
  );
}
