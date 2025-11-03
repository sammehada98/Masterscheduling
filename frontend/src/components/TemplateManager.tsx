import React, { useState, useEffect } from 'react';
import type { Department, Template, CreateTemplateInput } from '../types';
import { apiService } from '../services/api';
import './TemplateManager.css';

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const [formData, setFormData] = useState<CreateTemplateInput>({
    department: 'Parts',
    sessionCode: '',
    sessionName: '',
    description: '',
    academyCourse: '',
    defaultAttendeeType: '',
    defaultDuration: 60,
  });

  const departments: Department[] = ['Parts', 'Service', 'Sales', 'Accounting'];

  useEffect(() => {
    loadTemplates();
  }, [selectedDepartment]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const SUPER_ADMIN_USERNAME = import.meta.env.VITE_SUPER_ADMIN_USERNAME || 'admin';
      const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'admin123';
      
      const department = selectedDepartment === 'all' ? undefined : selectedDepartment;
      const response = await apiService.manageTemplates(
        {
          username: SUPER_ADMIN_USERNAME,
          password: SUPER_ADMIN_PASSWORD,
        },
        'list',
        { department }
      );
      setTemplates(response.templates || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const SUPER_ADMIN_USERNAME = import.meta.env.VITE_SUPER_ADMIN_USERNAME || 'admin';
      const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'admin123';
      
      // Use manageTemplates endpoint for super-admin
      await apiService.manageTemplates(
        {
          username: SUPER_ADMIN_USERNAME,
          password: SUPER_ADMIN_PASSWORD,
        },
        'create',
        formData
      );
      
      setShowForm(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      department: template.department,
      sessionCode: template.sessionCode,
      sessionName: template.sessionName,
      description: template.description || '',
      academyCourse: template.academyCourse || '',
      defaultAttendeeType: template.defaultAttendeeType || '',
      defaultDuration: template.defaultDuration || 60,
    });
    setShowForm(true);
  };

  const handleDelete = async (template: Template) => {
    if (!window.confirm(`Are you sure you want to delete template "${template.sessionName}"?`)) {
      return;
    }

    try {
      const SUPER_ADMIN_USERNAME = import.meta.env.VITE_SUPER_ADMIN_USERNAME || 'admin';
      const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'admin123';
      
      await apiService.manageTemplates(
        {
          username: SUPER_ADMIN_USERNAME,
          password: SUPER_ADMIN_PASSWORD,
        },
        'delete',
        { templateId: template.id }
      );
      await loadTemplates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete template');
    }
  };

  const resetForm = () => {
    setFormData({
      department: 'Parts',
      sessionCode: '',
      sessionName: '',
      description: '',
      academyCourse: '',
      defaultAttendeeType: '',
      defaultDuration: 60,
    });
  };

  const filteredTemplates = selectedDepartment === 'all' 
    ? templates 
    : templates.filter(t => t.department === selectedDepartment);

  return (
    <div className="template-manager">
      <div className="template-manager-header">
        <h2>Manage Templates</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              resetForm();
              setEditingTemplate(null);
            }
          }}
          className="primary-button"
        >
          {showForm ? 'Cancel' : 'Create New Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="template-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as Department })}
                required
                disabled={loading || !!editingTemplate}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sessionCode">Session Code *</label>
              <input
                id="sessionCode"
                type="text"
                value={formData.sessionCode}
                onChange={(e) => setFormData({ ...formData, sessionCode: e.target.value })}
                required
                disabled={loading || !!editingTemplate}
                placeholder="e.g., PARTS-101"
              />
            </div>
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
              placeholder="e.g., Basic Parts Training"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
              rows={3}
              placeholder="Session description..."
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
                placeholder="Course name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="defaultAttendeeType">Default Attendee Type</label>
              <input
                id="defaultAttendeeType"
                type="text"
                value={formData.defaultAttendeeType}
                onChange={(e) => setFormData({ ...formData, defaultAttendeeType: e.target.value })}
                disabled={loading}
                placeholder="e.g., Technician, Manager"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="defaultDuration">Default Duration (minutes) *</label>
            <input
              id="defaultDuration"
              type="number"
              value={formData.defaultDuration}
              onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 60 })}
              required
              min={15}
              max={480}
              step={15}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      )}

      <div className="template-filters">
        <label>Filter by Department:</label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value as Department | 'all')}
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {loading && <div className="loading">Loading templates...</div>}
      {error && !showForm && <div className="error-message">{error}</div>}

      {!loading && filteredTemplates.length === 0 && (
        <div className="empty-state">
          <p>No templates found. Create your first template to get started.</p>
        </div>
      )}

      {!loading && filteredTemplates.length > 0 && (
        <div className="templates-list">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-card-header">
                <div>
                  <h3>{template.sessionName}</h3>
                  <span className="template-badge">{template.department}</span>
                </div>
                <div className="template-code">{template.sessionCode}</div>
              </div>
              <div className="template-card-body">
                {template.description && <p>{template.description}</p>}
                <div className="template-details">
                  {template.academyCourse && (
                    <div className="detail-item">
                      <strong>Course:</strong> {template.academyCourse}
                    </div>
                  )}
                  {template.defaultAttendeeType && (
                    <div className="detail-item">
                      <strong>Attendee:</strong> {template.defaultAttendeeType}
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Duration:</strong> {template.defaultDuration} minutes
                  </div>
                </div>
              </div>
              <div className="template-card-actions">
                <button
                  onClick={() => handleEdit(template)}
                  className="action-button primary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template)}
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
  );
};

