import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPanel } from '../components/AdminPanel';
import { TemplateManager } from '../components/TemplateManager';
import { apiService } from '../services/api';
import './DealershipManagement.css';

interface Link {
  id: string;
  uniqueIdentifier: string;
  dealershipName: string;
  language: string;
  departments: string[];
  createdAt: string;
  accessUrl: string;
}

export const DealershipManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dealerships' | 'create' | 'templates'>('dealerships');
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check super-admin session
    const isSuperAdmin = sessionStorage.getItem('super_admin');
    if (!isSuperAdmin) {
      navigate('/login');
    } else {
      loadLinks();
    }
  }, [navigate]);

  const loadLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const SUPER_ADMIN_USERNAME = import.meta.env.VITE_SUPER_ADMIN_USERNAME || 'admin';
      const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'admin123';
      
      const response = await apiService.listLinks({
        username: SUPER_ADMIN_USERNAME,
        password: SUPER_ADMIN_PASSWORD,
      });
      setLinks(response.links || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dealerships');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('super_admin');
    sessionStorage.removeItem('super_admin_username');
    navigate('/login');
  };

  const handleLinkCreated = () => {
    loadLinks();
    setActiveTab('dealerships');
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to delete this dealership? This will also delete all associated sessions.')) {
      return;
    }

    try {
      // Note: You may need to create a deleteLink API endpoint
      setError('Delete functionality requires backend API endpoint');
      // For now, reload to show current state
      await loadLinks();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete dealership');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="dealership-management">
      <div className="management-header">
        <div>
          <h1>Masterscheduling - Dealership Management</h1>
          <p>Manage dealerships, links, and templates</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="management-tabs">
        <button
          className={activeTab === 'dealerships' ? 'active' : ''}
          onClick={() => setActiveTab('dealerships')}
        >
          All Dealerships ({links.length})
        </button>
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Create New Dealership
        </button>
        <button
          className={activeTab === 'templates' ? 'active' : ''}
          onClick={() => setActiveTab('templates')}
        >
          Manage Templates
        </button>
      </div>

      <div className="management-content">
        {activeTab === 'dealerships' && (
          <div className="dealerships-list">
            {loading && <div className="loading">Loading dealerships...</div>}
            {error && <div className="error-message">{error}</div>}
            {!loading && links.length === 0 && (
              <div className="empty-state">
                <p>No dealerships found. Create your first dealership to get started.</p>
                <button onClick={() => setActiveTab('create')} className="primary-button">
                  Create Dealership
                </button>
              </div>
            )}
            {!loading && links.length > 0 && (
              <div className="links-grid">
                {links.map((link) => (
                  <div key={link.id} className="link-card">
                    <div className="link-card-header">
                      <h3>{link.dealershipName}</h3>
                      <span className={`language-badge ${link.language}`}>
                        {link.language === 'fr' ? 'FR' : 'EN'}
                      </span>
                    </div>
                    <div className="link-card-body">
                      <div className="link-info-item">
                        <strong>Access URL:</strong>
                        <div className="link-url">
                          <code>{link.accessUrl}</code>
                          <button
                            onClick={() => copyToClipboard(link.accessUrl)}
                            className="copy-button"
                            title="Copy URL"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                      <div className="link-info-item">
                        <strong>Unique ID:</strong>
                        <code>{link.uniqueIdentifier}</code>
                      </div>
                      <div className="link-info-item">
                        <strong>Departments:</strong>
                        <span>{link.departments.length > 0 ? link.departments.join(', ') : 'None'}</span>
                      </div>
                      <div className="link-info-item">
                        <strong>Created:</strong>
                        <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="link-card-actions">
                      <button
                        onClick={() => window.open(link.accessUrl, '_blank')}
                        className="action-button primary"
                      >
                        Open Link
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="action-button danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-dealership">
            <AdminPanel onLinkCreated={handleLinkCreated} />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-management">
            <TemplateManager />
          </div>
        )}
      </div>
    </div>
  );
};

