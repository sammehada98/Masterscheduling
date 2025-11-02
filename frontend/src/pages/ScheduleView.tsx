import React, { useState, useEffect } from 'react';
import { DepartmentTabs } from '../components/DepartmentTabs';
import { SessionList } from '../components/SessionList';
import { MasterView } from '../components/MasterView';
import { SessionForm } from '../components/SessionForm';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import type { Session, Department, DepartmentInfo } from '../types';
import './ScheduleView.css';

export const ScheduleView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Department | 'Master'>('Parts');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [departmentColors, setDepartmentColors] = useState<Map<Department, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const user = authService.getCurrentUser();
  const isTrainer = authService.isTrainer();
  const accessibleDepartments = authService.getAccessibleDepartments();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'Master') {
      loadAllSessions();
    } else {
      loadSessions(activeTab);
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadDepartments(), loadSessions(activeTab)]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      const colorMap = new Map<Department, string>();
      response.departments.forEach((dept) => {
        colorMap.set(dept.name, dept.color);
      });
      setDepartmentColors(colorMap);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadSessions = async (department: Department) => {
    try {
      setRefreshing(true);
      const response = await apiService.getSessions(department);
      setSessions(response.sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadAllSessions = async () => {
    try {
      setRefreshing(true);
      const allDepts = ['Parts', 'Service', 'Sales', 'Accounting'] as Department[];
      const promises = allDepts.map((dept) => apiService.getSessions(dept));
      const results = await Promise.all(promises);
      const combined = results.flatMap((r) => r.sessions);
      setAllSessions(combined);
    } catch (error) {
      console.error('Error loading all sessions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveSession = async () => {
    setShowForm(false);
    setEditingSession(null);
    if (activeTab === 'Master') {
      await loadAllSessions();
    } else {
      await loadSessions(activeTab);
    }
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setShowForm(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await apiService.deleteSession(sessionId);
      if (activeTab === 'Master') {
        await loadAllSessions();
      } else {
        await loadSessions(activeTab);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete session');
    }
  };

  if (loading) {
    return (
      <div className="schedule-view-loading">
        <div className="loading-spinner"></div>
        <p>Loading schedule...</p>
      </div>
    );
  }

  const departmentColor = departmentColors.get(activeTab) || '#6B7280';

  return (
    <div className="schedule-view">
      <div className="schedule-view-header">
        <div className="header-content">
          <h1>Master Scheduling</h1>
          <div className="header-actions">
            <span className="user-info">
              {user?.dealershipName && <strong>{user.dealershipName}</strong>}
              {user?.codeType === 'trainer' ? ' 🔑 Trainer' : ' 👁️ View Only'}
            </span>
            {isTrainer && (
              <>
                <a href="/admin" className="admin-link-button">
                  Admin Dashboard
                </a>
                {activeTab !== 'Master' && (
                  <button
                    onClick={() => {
                      setEditingSession(null);
                      setShowForm(true);
                    }}
                    className="add-session-button"
                  >
                    + Add Session
                  </button>
                )}
              </>
            )}
            <a
              href={`/api/calendar/exportCalendar${activeTab !== 'Master' ? `?department=${activeTab}` : ''}`}
              download
              className="calendar-export-button"
            >
              📅 Export Calendar
            </a>
            <button onClick={() => authService.logout()} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>

        <DepartmentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accessibleDepartments={accessibleDepartments}
          isAdmin={isTrainer}
        />

      <div className="schedule-view-content">
        {refreshing && (
          <div className="refreshing-indicator">Refreshing...</div>
        )}
        
        {activeTab === 'Master' ? (
          <MasterView
            allSessions={allSessions}
            departmentColors={departmentColors}
          />
        ) : (
          <SessionList
            sessions={sessions}
            department={activeTab}
            departmentColor={departmentColor}
            isAdmin={isTrainer}
            onEdit={isTrainer ? handleEditSession : undefined}
            onDelete={isTrainer ? handleDeleteSession : undefined}
          />
        )}
      </div>

      {showForm && (
        <SessionForm
          session={editingSession}
          department={activeTab as Department}
          onSave={handleSaveSession}
          onCancel={() => {
            setShowForm(false);
            setEditingSession(null);
          }}
        />
      )}
    </div>
  );
};
