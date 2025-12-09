import { useState } from "react";
import VideoCall from "../components/VideoCall";
import Dashboard from "../components/Dashboard";
import Login from "../components/Login";
import Register from "../components/Register";
import PreMeeting from "../components/PreMeeting";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'dashboard' | 'premeeting' | 'videocall'>('login');
  const [meetingSettings, setMeetingSettings] = useState({ mic: true, cam: true });

  // Session persistence: check local storage on mount
  useState(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentPage('dashboard');
    }
  });

  return (
    <>
      {currentPage === 'login' && (
        <Login
          onLogin={() => setCurrentPage('dashboard')}
          onNavigateToRegister={() => setCurrentPage('register')}
        />
      )}
      {currentPage === 'register' && (
        <Register
          onRegister={() => setCurrentPage('dashboard')}
          onNavigateToLogin={() => setCurrentPage('login')}
        />
      )}
      {currentPage === 'premeeting' && (
        <PreMeeting
          onJoin={(mic, cam) => {
            setMeetingSettings({ mic, cam });
            setCurrentPage('videocall');
          }}
          onCancel={() => setCurrentPage('dashboard')}
        />
      )}
      {currentPage === 'dashboard' && (
        <Dashboard onJoinMeeting={() => setCurrentPage('premeeting')} />
      )}
      {currentPage === 'videocall' && (
        <VideoCall
          onLeave={() => setCurrentPage('dashboard')}
          initialMicOn={meetingSettings.mic}
          initialCamOn={meetingSettings.cam}
        />
      )}
    </>
  );
}
