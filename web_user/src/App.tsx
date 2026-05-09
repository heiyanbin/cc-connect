import { Routes, Route, Navigate } from 'react-router-dom';
import AgentList from '@/pages/AgentList';
import ConnectQR from '@/pages/ConnectQR';
import ChatView from '@/pages/ChatView';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route index element={<AgentList />} />
        <Route path="connect/:name" element={<ConnectQR />} />
        <Route path="chat/:name" element={<ChatView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}