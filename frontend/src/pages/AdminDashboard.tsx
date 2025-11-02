import React from 'react';
import { AdminPanel } from '../components/AdminPanel';
import { authService } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authService.isTrainer()) {
      navigate('/');
    }
  }, [navigate]);

  const handleLinkCreated = () => {
    // Optionally navigate or show success message
    console.log('Link created successfully');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => navigate('/schedule')} className="back-button">
          ← Back to Schedule
        </button>
      </div>
      <AdminPanel onLinkCreated={handleLinkCreated} />
    </div>
  );
};
