import { Routes, Route, Navigate } from 'react-router-dom';
import AgentList from './pages/AgentList';
import ConnectQR from './pages/ConnectQR';
import ChatView from './pages/ChatView';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Routes>
        <Route path="/" element={<AgentList />} />
        <Route path="/connect/:agentName" element={<ConnectQR />} />
        <Route path="/chat/:projectName" element={<ChatView />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}