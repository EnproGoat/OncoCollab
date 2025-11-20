import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket'; 

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = 'https://15c05feccb28.ngrok-free.app'; //Pour un test entre vrai user (pas prod) il faut passer par ngrok (gratuit)
const ROOM_ID = '123';
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:10.206.69.73:3478', 
            username: 'admin',
            credential: 'password'
        }
    ],
};

const MicIcon = ({ isEnabled }: { isEnabled: boolean }) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isEnabled ? (
            <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
            </>
        ) : (
            <>
                <line x1="1" y1="1" x2="23" y2="23" stroke="white" />
                <path d="M9 9v3a3 3 0 0 0 6 0v-1"/>
                <path d="M19 10v2a7 7 0 0 1-11.45 5.5"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
            </>
        )}
    </svg>
);

const VideoIcon = ({ isEnabled }: { isEnabled: boolean }) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {isEnabled ? (
            <>
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </>
        ) : (
            <>
                <path d="M1 1l22 22"/>
                <path d="M23 7l-7 5l7 5z"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </>
        )}
    </svg>
);

const VideoCall: React.FC = () => {
    const socketRef = useRef<AppSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const otherUserIdRef = useRef<string | null>(null);

    const [myId, setMyId] = useState<string | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isCaller, setIsCaller] = useState(false);
    const [otherUserId, setOtherUserId] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("Démarrage...");
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);

    const getMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;
            return stream;
        } catch (error) {
            console.error('Erreur lors de l\'accès au média:', error);
            setStatus("Erreur: Accès caméra/micro refusé. Veuillez autoriser l'accès.");
            return null;
        }
    }, []);

  useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit, stream: MediaStream, targetId: string) => {
        if (!pcRef.current || !socketRef.current) return;
    const existingTracks = pcRef.current.getSenders().map(s => s.track).filter(Boolean as any);
    stream.getTracks().forEach(track => {
        if (!existingTracks.includes(track)) {
            pcRef.current!.addTrack(track, stream);
        }
    });

    await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    
    socketRef.current.emit('sending-answer', answer, targetId);
    console.log(`Answer envoyée à ${targetId}`);
    }, []);

    const createOffer = useCallback(async (stream: MediaStream, targetId: string) => {
    if (!pcRef.current || !socketRef.current) return;
        const existingTracks = pcRef.current.getSenders().map(s => s.track).filter(Boolean as any);
        stream.getTracks().forEach(track => {
            if (!existingTracks.includes(track)) {
                pcRef.current!.addTrack(track, stream);
            }
        });

    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    
    socketRef.current.emit('sending-offer', offer, targetId);
    console.log(`Offer envoyée à ${targetId}`);
  }, []);

  const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
            setIsMicOn(prev => !prev);
        }
    };

    const toggleCam = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
            setIsCamOn(prev => !prev);
        }
    };

  useEffect(() => {
  const streamPromise = getMedia();
  const socket = io(SERVER_URL, {
      transports: ['polling', 'websocket'],
      extraHeaders: {
          "ngrok-skip-browser-warning": "true"
      }
  }) as AppSocket;

  socketRef.current = socket;

  socket.emit('join-room', ROOM_ID);  socket.on('connect', () => {
      setMyId(socket.id || null);
      setStatus("Connecté au serveur. En attente...");
  });

  socket.on('connect_error', (err) => {
      setStatus(`Erreur connexion: ${err.message}`);
  });

  pcRef.current = new RTCPeerConnection(ICE_SERVERS);

  pcRef.current.ontrack = (event: RTCTrackEvent) => {
      if (remoteVideoRef.current && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
      }
  };

  pcRef.current.onicecandidate = (event) => {
      if (event.candidate && otherUserIdRef.current && socketRef.current) {
        socketRef.current.emit('sending-ice-candidate', event.candidate.toJSON(), otherUserIdRef.current);
      }
  };

    socket.on('user-joined', async (userId: string) => {
        console.log(`Nouveau pair rejoint: ${userId}. Je l'appelle.`);
        setStatus(`Utilisateur détecté. Appel en cours...`);
        setIsCaller(true);
        setOtherUserId(userId);
        otherUserIdRef.current = userId;
        const stream = await streamPromise;
        if (stream) createOffer(stream, userId);
    });

    socket.on('get-existing-users', async (existingUsers: string[]) => {
        if (existingUsers.length > 0) {
            console.log(`Déjà ${existingUsers.length} utilisateur(s) présent(s).`);
            setStatus(`Utilisateur présent. En attente d'appel...`);
            setOtherUserId(existingUsers[0]);
            otherUserIdRef.current = existingUsers[0];
            setIsCaller(false);
        } else {
            setStatus("Seul dans la salle. En attente...");
        }
    });

    socket.on('receiving-offer', async (offer, fromId) => {
        console.log('Offer reçue. Création de l\'Answer.');
        setStatus("Appel entrant reçu. Connexion...");
        setOtherUserId(fromId);
        otherUserIdRef.current = fromId;
        const stream = await streamPromise;
        if (stream) createAnswer(offer, stream, fromId);
    });

    socket.on('receiving-answer', async (answer) => {
        console.log('Answer reçue. Définition de la description distante.');
        if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });

    socket.on('receiving-ice-candidate', async (candidate) => {
        console.log('ICE Candidate reçu. Ajout à la connexion.');
        try {
            await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'ICE Candidate:', error);
        }
    });


    return () => {
        socket.disconnect();
        pcRef.current?.close();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
    };

  }, [getMedia, createOffer, createAnswer]);

    const callUser = async () => {
        if (otherUserId && localStream) {
            setStatus("Tentative d'appel manuel...");
            createOffer(localStream, otherUserId);
        } else {
            alert("Impossible d'appeler : pas d'utilisateur ou pas de caméra.");
        }
    };

return (
    <div className="video-app-container">
            <style>{`
                /* Styles pour l'esthétique et la réactivité */
                :global(body) {
                    font-family: 'Inter', sans-serif;
                    background-color: #f3f4f6; 
                    margin: 0;
                    padding: 0;
                }
                
                .video-app-container {
                    padding: 1rem; 
                    margin: 0 auto;
                    max-width: 84rem; 
                    min-height: 100vh;
                    background-color: #f9fafb; 
                }

                .header {
                    font-size: 1.875rem; 
                    font-weight: 700; 
                    color: #4338ca; 
                    margin-bottom: 1.5rem; 
                    padding-bottom: 0.5rem; 
                    border-bottom: 1px solid #e5e7eb; 
                }

                .status-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    background-color: #ffffff;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    flex-wrap: wrap; /* Pour les petits écrans */
                    gap: 0.5rem;
                }
                .status-id-label {
                    font-weight: 600;
                    color: #4b5563; 
                }
                .status-id-value {
                    font-family: monospace;
                    color: #6366f1; 
                    font-size: 0.75rem; 
                    word-break: break-all;
                }
                .status-value {
                    margin-left: 0.5rem;
                    color: #10b981; 
                    font-weight: 500;
                }
                
                @media (min-width: 768px) { 
                    .video-app-container {
                        padding: 2rem; 
                    }
                    .status-id-value, .status-value {
                        font-size: 1rem; 
                    }
                }
                
                /* Contrôles Média */
                .controls {
                    display: flex;
                    justify-content: center;
                    gap: 1rem; 
                    margin-bottom: 2rem; 
                }
                .control-button {
                    padding: 0.75rem; 
                    border-radius: 9999px; 
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); 
                    transition: background-color 0.2s;
                    color: white;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 48px; 
                    height: 48px;
                }
                .control-button-on {
                    background-color: #6366f1; 
                }
                .control-button-on:hover {
                    background-color: #4f46e5; 
                }
                .control-button-off {
                    background-color: #ef4444; 
                }
                .control-button-off:hover {
                    background-color: #dc2626; 
                }
                .control-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .icon {
                    width: 1.5rem; 
                    height: 1.5rem; 
                    color: white;
                }

                /* Grille Vidéo (adaptée pour 2 vidéos) */
                .video-grid {
                    display: grid;
                    gap: 1rem; 
                    grid-template-columns: repeat(1, minmax(0, 1fr)); /* Mobile par défaut */
                }
                @media (min-width: 768px) { 
                    .video-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr)); /* Deux colonnes sur desktop */
                    }
                }

                /* Carte Vidéo */
                .video-card {
                    background-color: black; 
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); 
                    border-radius: 0.75rem; 
                    overflow: hidden;
                    position: relative;
                    aspect-ratio: 16 / 9; 
                }
                
                .video-card video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .video-label {
                    padding: 0.5rem;
                    text-align: center;
                    font-size: 1rem;
                    font-weight: 600;
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    color: white;
                }
                
                .local-card {
                    border: 4px solid #818cf8; 
                }
                .remote-card {
                    border: 4px solid #f87171; 
                }
            `}</style>

            <h1 className="header">OncoCollab (Visioconférence 1-à-1)</h1>
            
            <div className="status-bar">
                <p>
                    <span className="status-id-label">Mon ID : </span> 
                    <span className="status-id-value">{myId ? myId.substring(0, 8) : 'Connexion...'}</span>
                </p>
                <p>
                    <span className="status-id-label">Statut :</span> 
                    <span className="status-value">{status}</span>
                </p>
            </div>

            {/* Contrôles Vidéo/Audio */}
            <div className="controls">
                <button 
                    onClick={toggleMic}
                    className={`control-button ${isMicOn ? 'control-button-on' : 'control-button-off'}`}
                    disabled={!localStream}
                >
                    <MicIcon isEnabled={isMicOn} />
                </button>
                <button 
                    onClick={toggleCam}
                    className={`control-button ${isCamOn ? 'control-button-on' : 'control-button-off'}`}
                    disabled={!localStream}
                >
                    <VideoIcon isEnabled={isCamOn} />
                </button>
            </div>

            {/* Grille de vidéos */}
            <div className="video-grid">
                <div className="video-card local-card">
                    <video ref={localVideoRef} autoPlay muted playsInline />
                    <div className="video-label">Moi</div>
                </div>
                <div className="video-card remote-card">
                    <video ref={remoteVideoRef} autoPlay playsInline />
                    <div className="video-label">Interlocuteur</div>
                </div>
            </div>
    </div>
);
};

export default VideoCall;