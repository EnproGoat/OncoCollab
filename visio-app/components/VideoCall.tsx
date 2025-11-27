import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket';
import patientsData from '../src/data/mockData.json';

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
}

const VideoCall: React.FC<VideoCallProps> = ({ onLeave }) => {
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
  const [selectedPatient, setSelectedPatient] = useState(patientsData[0]);

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

    socket.emit('join-room', ROOM_ID);

    socket.on('connect', () => {
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
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="text-white text-sm">
            OncoCollab | ID: {myId ? myId.substring(0, 8) : 'Connexion...'}
          </div>
          <div className="text-white/80 text-sm">{status}</div>
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">
            ⚙️ Paramètres
          </button>
        </div>

        <div className="flex gap-4 px-4 pb-3 overflow-x-auto justify-center">
          <div className="relative shrink-0 w-48 h-32 bg-black rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
              Moi
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isMicOn ? 'bg-teal-500' : 'bg-red-500'}`}>
                {isMicOn ? '🎤' : '🔇'}
              </div>
            </div>
          </div>
          {/* Camera autres */}
          <div className="relative shrink-0 w-48 h-32 bg-black rounded-lg overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
              Interlocuteur
            </div>
          </div>

          {[1, 2, 3].map((i) => (
            <div key={i} className="relative shrink-0 w-48 h-32 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
              <span className="text-white/40 text-4xl">👤</span>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                Participant {i + 2}
              </div>
            </div>
          ))}
        </div>

        <div className="relative flex justify-center items-center px-4 pb-3">
          <div className="flex gap-4">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full transition-all flex items-center justify-center shadow-lg ${isMicOn ? 'bg-teal-500 hover:bg-teal-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              <MicIcon isEnabled={isMicOn} />
            </button>
            <button
              onClick={toggleCam}
              className={`p-4 rounded-full transition-all flex items-center justify-center shadow-lg ${isCamOn ? 'bg-teal-500 hover:bg-teal-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              <VideoIcon isEnabled={isCamOn} />
            </button>
          </div>
          <div className="absolute right-4">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all">
              🖥️ Plein écran
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* formulaires */}
        <div className="w-64 bg-slate-900/50 backdrop-blur-sm border-r border-slate-800 flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-slate-300 font-semibold mb-3 uppercase text-xs tracking-wider">Dossiers Patients</h3>
            <div className="space-y-2">
              {patientsData.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full px-4 py-3 border border-transparent text-left transition-all text-sm rounded-lg ${selectedPatient.id === patient.id
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                    : 'bg-slate-800/50 hover:bg-teal-500/20 hover:border-teal-500/50 text-slate-200'
                    }`}
                >
                  {patient.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/80">
            <button
              onClick={onLeave}
              className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
            >
              <span>🚪</span> Quitter la réunion
            </button>
          </div>
        </div>

        {/* Affichage des données */}
        <div className="flex-1 bg-slate-950 p-6 overflow-y-auto">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-full shadow-xl">
            <h2 className="text-teal-400 text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-3xl">📋</span> Dossier Médical
            </h2>
            <div className="text-white/80 space-y-4">
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="text-white/60 text-sm">Nom du patient</div>
                  <div className="text-white font-semibold">{selectedPatient.name}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="text-white/60 text-sm">Date de naissance</div>
                  <div className="text-white font-semibold">{selectedPatient.birthDate}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="text-white/60 text-sm">Type de cancer</div>
                  <div className="text-white font-semibold">{selectedPatient.cancerType}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="text-white/60 text-sm">Stade</div>
                  <div className="text-white font-semibold">{selectedPatient.stage}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="text-white/60 text-sm">Statut</div>
                  <div className="text-white font-semibold">{selectedPatient.status}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="text-white/60 text-sm">Dernière consultation</div>
                  <div className="text-white font-semibold">{selectedPatient.lastConsultation}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="w-80 bg-slate-900/50 backdrop-blur-sm border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80">
            <h3 className="text-white font-semibold">💬 Chat</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <div className="text-white/60 text-xs mb-1">Dr. Martin - 14:32</div>
              <div className="text-white text-sm">Bonjour à tous, prêt pour la RCP</div>
            </div>
            <div className="bg-teal-600/20 border border-teal-500/30 rounded-lg p-3 ml-6">
              <div className="text-white/60 text-xs mb-1">Moi - 14:33</div>
              <div className="text-white text-sm">Oui, j'ai préparé le dossier</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <div className="text-white/60 text-xs mb-1">Dr. Dubois - 14:35</div>
              <div className="text-white text-sm">Parfait, on peut commencer</div>
            </div>
          </div>

          {/* Input chat */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500 border border-slate-700"
              />
              <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all">
                📤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;