import React, { useState, useEffect } from 'react';
import type { Session, Template, Department, CreateSessionInput } from '../types';
import { apiService } from '../services/api';
import './SessionForm.css';

interface SessionFormProps {
  session?: Session | null;
  department: Department;
  onSave: () => void;
  onCancel: () => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  session,
  department,
  onSave,
  onCancel,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [formData, setFormData] = useState<CreateSessionInput>({
    department,
    sessionCode: '',
    sessionName: '',
    description: '',
    academyCourse: '',
    attendeeType: '',
    startDateTime: new Date().toISOString().slice(0, 16),
    duration: 60,
    sessionCount: 1,
  });

  useEffect(() => {
    loadTemplates();
    if (session) {
      setFormData({
        department: session.department,
        sessionCode: session.sessionCode,
        sessionName: session.sessionName,
        description: session.description || '',
        academyCourse: session.academyCourse || '',
        attendeeType: session.attendeeType || '',
        startDateTime: new Date(session.startDateTime).toISOString().slice(0, 16),
        duration: session.duration,
        sessionCount: session.sessionCount,
      });
    }
  }, [session, department]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await apiService.getTemplates(department);
      setTemplates(response.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplate = (template: Template) => {
    setFormData({
      ...formData,
      sessionCode: template.sessionCode,
      sessionName: template.sessionName,
      description: template.description || '',
      academyCourse: template.academyCourse || '',
      attendeeType: template.defaultAttendeeType || '',
      duration: template.defaultDuration,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert local datetime to ISO string
      const isoDateTime = new Date(formData.startDateTime).toISOString();
      
      if (session) {
        await apiService.updateSession(session.id, {
          ...formData,
          startDateTime: isoDateTime,
        });
      } else {
        await apiService.createSession({
          ...formData,
          startDateTime: isoDateTime,
        });
      }
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="session-form-overlay" onClick={onCancel}>
      <div className="session-form" onClick={(e) => e.stopPropagation()}>
        <div className="session-form-header">
          <h2>{session ? 'Edit Session' : 'Create New Session'}</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="session-form-content">
          {templates.length > 0 && (
            <div className="template-section">
              <label>Load Template</label>
              <select
                onChange={(e) => {
                  const template = templates.find((t) => t.id === e.target.value);
                  if (template) loadTemplate(template);
                }}
                disabled={loadingTemplates || loading}
                value=""
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.sessionCode} - {template.sessionName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sessionCode">Session Code *</label>
              <input
                id="sessionCode"
                type="text"
                value={formData.sessionCode}
                onChange={(e) => setFormData({ ...formData, sessionCode: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sessionName">Session Name *</label>
              <input
                id="sessionName"
                type="text"
                value={formData.sessionName}
                onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="academyCourse">Academy Course</label>
              <input
                id="academyCourse"
                type="text"
                value={formData.academyCourse}
                onChange={(e) => setFormData({ ...formData, academyCourse: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="attendeeType">Attendee Type</label>
              <input
                id="attendeeType"
                type="text"
                value={formData.attendeeType}
                onChange={(e) => setFormData({ ...formData, attendeeType: e.target.value })}
                placeholder="Free type or default"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDateTime">Start Date & Time *</label>
              <input
                id="startDateTime"
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                min="1"
                max="1440"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sessionCount">Session Count *</label>
              <input
                id="sessionCount"
                type="number"
                value={formData.sessionCount}
                onChange={(e) => setFormData({ ...formData, sessionCount: parseInt(e.target.value) || 1 })}
                min="1"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : session ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
