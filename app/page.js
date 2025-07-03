'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import Head from 'next/head'; // Ensure this import is present

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [callStatus, setCallStatus] = useState('Ready to call');
  const [retellWebClient, setRetellWebClient] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const transcriptRef = useRef(null);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
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
      <Head>
        <title>Meet Gabbi - The Future Is Now</title> {/* Set the desired title */}
      </Head>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <div style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
        background: 'linear-gradient(145deg, #1a1a3d, #2a1b5e, #3c2f7a)',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        padding: isMobile ? '15px' : '30px',
        position: 'relative',
        backgroundAttachment: 'fixed',
      }}>
        {/* Subtle Animated Background Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.1), transparent 70%)',
          animation: 'bgGlow 15s ease-in-out infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}></div>

        {/* Logo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: isMobile ? '30px' : '40px',
          zIndex: 10,
        }}>
          <img 
            src="https://cdn-ilclclp.nitrocdn.com/uiuLNoPKqvsktnRsIDyDgFJzxCWoSfSE/assets/images/optimized/rev-1557504/protectingpatientrights.com/wp-content/uploads/2024/11/white-logo-1-1.webp"
            alt="Logo"
            style={{
              height: isMobile ? '45px' : '65px',
              width: 'auto',
              filter: 'drop-shadow(0 4px 12px rgba(0, 255, 255, 0.3))',
              maxWidth: '85%',
              transition: 'transform 0.3s ease',
            }}
            onError={(e) => {
              console.log('Logo failed to load');
              e.target.style.display = 'none';
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
        </div>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '15px' : '30px',
          maxWidth: '1400px',
          width: '100%',
          flexDirection: isMobile ? 'column' : 'row',
          zIndex: 10,
        }}>
          {/* Audio Sphere Section */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '10px' : '20px',
          }}>
            <div 
              onClick={isCallActive ? stopCall : startCall}
              style={{
                width: isMobile ? '150px' : '200px',
                height: isMobile ? '150px' : '200px',
                background: 'linear-gradient(135deg, #00f7ff, #ff6bcb, #ff4757)',
                borderRadius: '50%',
                position: 'relative',
                boxShadow: isCallActive 
                  ? '0 0 50px rgba(0, 255, 255, 0.9), 0 0 100px rgba(255, 107, 203, 0.7)'
                  : '0 0 30px rgba(0, 255, 255, 0.6), 0 0 60px rgba(255, 107, 203, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '2.2rem' : '3.2rem',
                animation: isCallActive 
                  ? 'pulse 1.2s infinite ease-in-out' 
                  : 'pulse 2.5s infinite ease-in-out',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              🎤
            </div>

            <button 
              onClick={isCallActive ? stopCall : startCall}
              style={{
                marginTop: '25px',
                padding: isMobile ? '12px 35px' : '15px 50px',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '600',
                color: '#ffffff',
                background: isCallActive 
                  ? 'linear-gradient(90deg, #ff4757, #ff1f3d)'
                  : 'linear-gradient(90deg, #00f7ff, #ff6bcb)',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isCallActive
                  ? '0 6px 20px rgba(255, 71, 87, 0.5)'
                  : '0 6px 20px rgba(0, 255, 255, 0.5)',
                fontFamily: "'Manrope', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1.05)'}
            >
              {isCallActive ? 'End Call' : 'Start Call'}
            </button>

            <div style={{
              marginTop: '15px',
              padding: isMobile ? '8px 15px' : '10px 25px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              borderRadius: '30px',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '500',
              color: '#00f7ff',
              textAlign: 'center',
              minWidth: isMobile ? '180px' : '220px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
            }}>
              {callStatus}
            </div>
          </div>

          {/* Transcript Section */}
          <div style={{
            flex: 1,
            maxHeight: isMobile ? '300px' : '400px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          }}>
            <h2 style={{
              fontSize: isMobile ? '20px' : '26px',
              fontWeight: '700',
              marginBottom: '15px',
              color: '#00f7ff',
              flexShrink: 0,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>
              Live Transcript
            </h2>
            
            <div 
              ref={transcriptRef}
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: isMobile ? '15px' : '16px',
                lineHeight: '1.7',
                color: '#ffffff',
                fontWeight: '700',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '8px',
                scrollBehavior: 'smooth',
                letterSpacing: '0.2px',
              }}
            >
              {transcript ? (
                <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
                  {transcript.split('\n\n').map((line, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '10px',
                        padding: isMobile ? '8px 12px' : '10px 15px',
                        borderRadius: '15px',
                        background: line.startsWith('👩 Emma')
                          ? 'rgba(0, 153, 255, 0.2)'
                          : 'rgba(0, 255, 153, 0.2)',
                        maxWidth: isMobile ? '90%' : '80%',
                        alignSelf: line.startsWith('👩 Emma') ? 'flex-start' : 'flex-end',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        display: 'inline-block',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.02)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 255, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                      }}
                    >
                      {line.startsWith('👩 Emma') ? (
                        <span>
                          <span style={{ color: '#0099ff' }}>👩 Emma:</span>
                          <span style={{ color: '#ffffff' }}>{line.slice(8)}</span>
                        </span>
                      ) : line.startsWith('👤 You') ? (
                        <span>
                          <span style={{ color: '#00ff99' }}>👤 You:</span>
                          <span style={{ color: '#ffffff' }}>{line.slice(7)}</span>
                        </span>
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontStyle: 'italic',
                  fontWeight: '400',
                  textAlign: 'center',
                  marginTop: '40px',
                  fontSize: isMobile ? '14px' : '15px',
                }}>
                  Your conversation will appear here in real-time...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Powered by Text */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: isMobile ? '30px' : '40px',
          zIndex: 10,
        }}>
          <div style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: isMobile ? '11px' : '13px',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            textAlign: 'center',
            filter: 'drop-shadow(0 2px 6px rgba(0, 255, 255, 0.3))',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.color = '#00f7ff'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
          >
            POWERED BY MEET GABBI
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.85;
            }
            50% {
              transform: scale(1.08);
              opacity: 1;
            }
          }

          @keyframes bgGlow {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.1);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Custom Scrollbar */
          div::-webkit-scrollbar {
            width: 6px;
          }
          
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          
          div::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #00f7ff, #ff6bcb);
            border-radius: 12px;
            transition: background 0.3s ease;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #00b7cc, #ff3b8e);
          }
        `}</style>
      </div>
    </>
  );
}
