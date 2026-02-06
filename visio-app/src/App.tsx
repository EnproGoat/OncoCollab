import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Meetings from './pages/Meetings';
import Chat from './pages/Chat';
import WSIAnalysis from './pages/WSIAnalysis';
import PreMeeting from './pages/PreMeeting';
import MeetingCall from './pages/MeetingCall';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/meetings" element={
          <ProtectedRoute>
            <Meetings />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/wsi-analysis" element={
          <ProtectedRoute>
            <WSIAnalysis />
          </ProtectedRoute>
        } />
        <Route path="/meeting/:meetingId/premeeting" element={
          <ProtectedRoute>
            <PreMeeting />
          </ProtectedRoute>
        } />
        <Route path="/meeting/:meetingId/call" element={
          <ProtectedRoute>
            <MeetingCall />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
