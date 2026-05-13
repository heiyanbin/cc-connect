import { Routes, Route, Navigate } from 'react-router-dom';
import AgentList from './pages/AgentList';
import AgentLayout from './pages/AgentLayout';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Routes>
        <Route path="/" element={<AgentList />} />
        <Route path="/agent/:agentName" element={<AgentLayout />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}