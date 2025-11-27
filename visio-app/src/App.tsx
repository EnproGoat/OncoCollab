import { useState } from "react";
import VideoCall from "../components/VideoCall";
import Dashboard from "../components/Dashboard";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'videocall'>('dashboard');

  return (
    <>
      {currentPage === 'dashboard' ? (
        <Dashboard onJoinMeeting={() => setCurrentPage('videocall')} />
      ) : (
        <VideoCall onLeave={() => setCurrentPage('dashboard')} />
      )}
    </>
  );
}
