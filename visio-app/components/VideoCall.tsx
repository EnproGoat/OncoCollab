import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket';
import patientsData from '../src/data/mockData.json';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = "https://cc38c5c8f116.ngrok-free.app";
const ROOM_ID = '123';
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:10.184.232.73:3478',
      username: 'admin',
      credential: 'password'
    }
  ],
};

const MicIcon = ({ isEnabled }: { isEnabled: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {isEnabled ? (
      <>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
      </>
    ) : (
      <>
        <line x1="1" y1="1" x2="23" y2="23" stroke="white" />
        <path d="M9 9v3a3 3 0 0 0 6 0v-1" />
        <path d="M19 10v2a7 7 0 0 1-11.45 5.5" />
        <line x1="12" y1="19" x2="12" y2="23" />
      </>
    )}
  </svg>
);

const VideoIcon = ({ isEnabled }: { isEnabled: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {isEnabled ? (
      <>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </>
    ) : (
      <>
        <path d="M1 1l22 22" />
        <path d="M23 7l-7 5l7 5z" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </>
    )}
  </svg>
);

interface VideoCallProps {
  onLeave: () => void;
  initialMicOn?: boolean;
  initialCamOn?: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ onLeave, initialMicOn = true, initialCamOn = true }) => {
  const socketRef = useRef<AppSocket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [myId, setMyId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const [status, setStatus] = useState<string>("Démarrage...");
  const [isMicOn, setIsMicOn] = useState(initialMicOn);
  const [isCamOn, setIsCamOn] = useState(initialCamOn);
  const [selectedPatient, setSelectedPatient] = useState(patientsData[0]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [activeTab, setActiveTab] = useState<'info' | 'participants' | 'chat'>('info');

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = isMicOn));
      localStream.getVideoTracks().forEach(track => (track.enabled = isCamOn));
    }
  }, [localStream, isMicOn, isCamOn]);

  const addRemoteStream = useCallback((id: string, stream: MediaStream) => {
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.set(id, stream);
      return newMap;
    });
  }, []);

  const removeRemoteStream = useCallback((id: string) => {
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true
      });

      stream.getAudioTracks().forEach(track => (track.enabled = initialMicOn));
      stream.getVideoTracks().forEach(track => (track.enabled = initialCamOn));

      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Erreur accès média:', error);
      setStatus("Erreur: Accès caméra/micro refusé.");
      return null;
    }
  }, [initialMicOn, initialCamOn]);

  const createPeerConnection = useCallback((targetId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('sending-ice-candidate', event.candidate.toJSON(), targetId);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        addRemoteStream(targetId, event.streams[0]);
      }
    };

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    peersRef.current.set(targetId, pc);
    return pc;
  }, [addRemoteStream]);

  useEffect(() => {
    let mounted = true;
    const streamPromise = getMedia();
    const socket = io(SERVER_URL, {
      transports: ['polling', 'websocket'],
      extraHeaders: {
        "ngrok-skip-browser-warning": "true"
      }
    }) as AppSocket;

    socketRef.current = socket;

    socket.emit('join-room', ROOM_ID);

    socket.on('connect', () => {
      if (mounted) {
        setMyId(socket.id || null);
        setStatus("Connecté. En attente de participants...");
      }
    });

    socket.on('user-joined', async (userId) => {
      if (!mounted) return;
      console.log(`User joined: ${userId}`);
      const stream = localStreamRef.current;
      if (stream) {
        const pc = createPeerConnection(userId, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('sending-offer', offer, userId);
      }
    });

    socket.on('receiving-offer', async (offer, fromId) => {
      if (!mounted) return;
      console.log(`Offer from: ${fromId}`);
      const stream = localStreamRef.current || await streamPromise;
      if (stream) {
        const pc = createPeerConnection(fromId, stream);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('sending-answer', answer, fromId);
      }
    });

    socket.on('receiving-answer', async (answer: RTCSessionDescriptionInit, fromId?: string) => {
      if (fromId) {
        const pc = peersRef.current.get(fromId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      }
    });

    socket.on('receiving-ice-candidate', async (candidate, fromId) => {
      const pc = peersRef.current.get(fromId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('user-left', (userId: string) => {
      console.log(`User left: ${userId}`);
      if (peersRef.current.has(userId)) {
        peersRef.current.get(userId)?.close();
        peersRef.current.delete(userId);
        removeRemoteStream(userId);
      }
    });

    streamPromise.then(stream => {
      if (!mounted && stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    });

    return () => {
      mounted = false;
      socket.disconnect();
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [getMedia, createPeerConnection, addRemoteStream, removeRemoteStream]);

  const toggleMic = () => {
    setIsMicOn(prev => !prev);
  };

  const toggleCam = () => {
    setIsCamOn(prev => !prev);
  };

  const allStreams = [
    { id: 'me', stream: localStream, isLocal: true },
    ...Array.from(remoteStreams.entries()).map(([id, stream]) => ({ id, stream, isLocal: false }))
  ].filter(item => item.stream !== null) as { id: string; stream: MediaStream; isLocal: boolean }[];

  const visibleStreams = isFullScreen ? allStreams : allStreams.slice(0, 5);
  const hiddenCount = allStreams.length - visibleStreams.length;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-white text-sm">
            OncoCollab | ID: {myId ? myId.substring(0, 8) : '...'} | {allStreams.length} participant(s)
          </div>
          <div className="text-white/80 text-sm hidden md:block">{status}</div>
          <button onClick={() => setIsFullScreen(!isFullScreen)} className={`px-4 py-2 rounded-lg transition-all text-sm ${isFullScreen ? 'bg-teal-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
            {isFullScreen ? 'Quitter' : '🖥️ Plein écran'}
          </button>
        </div>

        {/* Video Grid Area */}
        <div className={`
             ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-950 p-4' : 'relative p-4 flex justify-center'}
             transition-all duration-300
        `}>
          {isFullScreen && (
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
            >
              ✕
            </button>
          )}

          <div className={`flex flex-wrap justify-center content-center gap-4 w-full max-w-7xl mx-auto h-full ${isFullScreen ? '' : ''}`}>
            {visibleStreams.map((item) => (
              <div key={item.id} className="relative bg-black rounded-xl overflow-hidden shadow-lg border border-slate-800 w-full max-w-[20rem] sm:w-80 aspect-video shrink-0">
                {(!isCamOn && item.isLocal) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                      <span className="text-xl">📷</span>
                    </div>
                  </div>
                )}
                <video
                  ref={(el) => {
                    if (el && item.stream) el.srcObject = item.stream;
                  }}
                  autoPlay
                  muted={item.isLocal} // Mute self to avoid echo
                  playsInline
                  className={`w-full h-full object-cover ${item.isLocal ? 'scale-x-[-1]' : ''} ${(!isCamOn && item.isLocal) ? 'hidden' : ''}`}
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium z-20">
                  {item.isLocal ? 'Moi' : `Participant ${item.id.substring(0, 4)}`}
                </div>
                {item.isLocal && (
                  <div className="absolute top-2 right-2 flex gap-1 z-20">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isMicOn ? 'bg-teal-500' : 'bg-red-500'}`}>
                      {isMicOn ? '🎤' : '🔇'}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Indicator for hidden users */}
            {!isFullScreen && hiddenCount > 0 && (
              <div
                onClick={() => setIsFullScreen(true)}
                className="relative bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition w-full max-w-[20rem] sm:w-80 aspect-video shrink-0"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">+{hiddenCount}</div>
                  <div className="text-slate-400 text-sm">autres participants</div>
                  <div className="text-teal-400 text-xs mt-2 uppercase tracking-wide font-bold">Voir tout</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        {!isFullScreen && (
          <div className="flex justify-center items-center px-4 pb-3">
            <div className="flex gap-4">
              <button
                onClick={toggleMic}
                className={`p-4 rounded-full transition-all flex items-center justify-center shadow-lg transform hover:scale-105 ${isMicOn ? 'bg-teal-500 hover:bg-teal-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                <MicIcon isEnabled={isMicOn} />
              </button>
              <button
                onClick={toggleCam}
                className={`p-4 rounded-full transition-all flex items-center justify-center shadow-lg transform hover:scale-105 ${isCamOn ? 'bg-teal-500 hover:bg-teal-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                <VideoIcon isEnabled={isCamOn} />
              </button>
              <button
                onClick={onLeave}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-105"
                title="Quitter"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {!isFullScreen && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar */}
          <div className={`${activeTab === 'participants' ? 'absolute inset-0 z-40 bg-slate-950 w-full flex' : 'hidden'} md:flex md:static md:w-64 bg-slate-900/50 backdrop-blur-sm border-r border-slate-800 flex-col`}>
            <div className="p-4 flex-1 overflow-y-auto">
              <h3 className="text-slate-300 font-semibold mb-3 uppercase text-xs tracking-wider">Participants</h3>
              <div className="space-y-2">
                {patientsData.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPatient(p);
                      if (window.innerWidth < 768) setActiveTab('info');
                    }}
                    className={`w-full px-4 py-3 border border-transparent text-left transition-all text-sm rounded-lg ${selectedPatient.id === p.id
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                      : 'bg-slate-800/50 hover:bg-teal-500/20 hover:border-teal-500/50 text-slate-200'
                      }`}
                  >
                    {p.profession}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content (Patient Info) */}
          <div className={`${activeTab === 'info' ? 'flex' : 'hidden'} md:flex flex-1 bg-slate-950 p-6 overflow-y-auto`}>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl w-full">
              <h2 className="text-teal-400 text-2xl font-bold mb-4 flex items-center gap-2">
                <span>📋</span> Dossier Médical
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="text-white/60 text-sm mb-1">Nom</div>
                  <div className="text-white font-semibold text-lg">{selectedPatient.name}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="text-white/60 text-sm mb-1">Profession</div>
                  <div className="text-white font-semibold text-lg">{selectedPatient.profession}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className={`${activeTab === 'chat' ? 'absolute inset-0 z-40 bg-slate-950 w-full flex' : 'hidden'} lg:flex lg:static lg:w-80 bg-slate-900/50 backdrop-blur-sm border-l border-slate-800 flex-col`}>
            {/* Chat UI */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80">
              <h3 className="text-white font-semibold">Message</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <div className="text-white/60 text-xs mb-1">Système</div>
                <div className="text-white text-sm">Bienvenue dans la réunion.</div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800">
              <input type="text" placeholder="Message..." className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500" />
            </div>
          </div>

          {/* Mobile Tab Bar */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-2 z-50 md:justify-end md:gap-4 md:px-6">
            <button
              onClick={() => setActiveTab('participants')}
              className={`p-2 rounded-lg flex flex-col items-center md:hidden ${activeTab === 'participants' ? 'text-teal-400' : 'text-slate-400'}`}
            >
              <span className="text-xl">👥</span>
              <span className="text-[10px]">Participants</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`p-2 rounded-lg flex flex-col items-center md:hidden ${activeTab === 'info' ? 'text-teal-400' : 'text-slate-400'}`}
            >
              <span className="text-xl">📋</span>
              <span className="text-[10px]">Info</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`p-2 rounded-lg flex flex-col items-center ${activeTab === 'chat' ? 'text-teal-400' : 'text-slate-400'}`}
            >
              <span className="text-xl">💬</span>
              <span className="text-[10px]">Chat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;