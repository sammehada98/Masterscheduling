import React, { useState } from 'react';
import type { Department, CreateLinkInput } from '../types';
import { apiService } from '../services/api';
import './AdminPanel.css';

interface AdminPanelProps {
  onLinkCreated: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLinkCreated }) => {
  const [dealershipName, setDealershipName] = useState('');
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [trainerCode, setTrainerCode] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const departments: Department[] = ['Parts', 'Service', 'Sales', 'Accounting'];

  const toggleDepartment = (dept: Department) => {
    setSelectedDepartments((prev) =>
      prev.includes(dept)
        ? prev.filter((d) => d !== dept)
        : [...prev, dept]
    );
  };

  const generateCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerateCodes = () => {
    setAdminCode(generateCode());
    setCustomerCode(generateCode());
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: CreateLinkInput = {
        dealershipName,
        language,
        trainerCode: trainerCode || undefined,
        customerCode: customerCode || undefined,
        customerDepartments: selectedDepartments,
      };

      const response = await apiService.createLink(data);
      setCreatedLink(response.link);
      setDealershipName('');
      setLanguage('en');
      setTrainerCode('');
      setCustomerCode('');
      setSelectedDepartments([]);
      onLinkCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-container">
        <h2>Create New Link</h2>
        <p className="admin-panel-subtitle">
          Generate a secure link with admin and customer codes
        </p>

        {createdLink && (
          <div className="admin-panel-success">
            <h3>Link Created Successfully!</h3>
              <div className="link-details">
              <div className="link-detail-item">
                <strong>Access URL:</strong>
                <code>{createdLink.accessUrl || `/?id=${createdLink.uniqueIdentifier}`}</code>
              </div>
              <div className="link-detail-item">
                <strong>Dealership:</strong>
                <span>{createdLink.dealershipName}</span>
              </div>
              <div className="link-detail-item">
                <strong>Language:</strong>
                <span>{createdLink.language === 'fr' ? 'Français' : 'English'}</span>
              </div>
              <div className="link-detail-item">
                <strong>Unique Identifier:</strong>
                <code>{createdLink.uniqueIdentifier}</code>
              </div>
              <div className="link-detail-item">
                <strong>Trainer Code:</strong>
                <code>{createdLink.trainerCode}</code>
              </div>
              <div className="link-detail-item">
                <strong>Customer Code:</strong>
                <code>{createdLink.customerCode}</code>
              </div>
              <div className="link-detail-item">
                <strong>Customer Departments:</strong>
                <span>{createdLink.customerDepartments.join(', ') || 'None'}</span>
              </div>
            </div>
            <button
              onClick={() => setCreatedLink(null)}
              className="admin-panel-button secondary"
            >
              Create Another Link
            </button>
          </div>
        )}

        {!createdLink && (
          <form onSubmit={handleCreateLink} className="admin-panel-form">
            <div className="form-section">
              <div className="form-section-header">
                <h3>Codes</h3>
                <button
                  type="button"
                  onClick={handleGenerateCodes}
                  className="generate-button"
                >
                  Generate Random Codes
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="adminCode">Admin Code</label>
                  <input
                    id="adminCode"
                    type="text"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                    placeholder="Leave empty to auto-generate"
                    pattern="[A-Za-z0-9]{6,20}"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customerCode">Customer Code</label>
                  <input
                    id="customerCode"
                    type="text"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                    placeholder="Leave empty to auto-generate"
                    pattern="[A-Za-z0-9]{6,20}"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Customer Code Departments</h3>
              <p className="section-description">
                Select which departments the customer code can access
              </p>
              <div className="departments-grid">
                {departments.map((dept) => (
                  <label key={dept} className="department-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(dept)}
                      onChange={() => toggleDepartment(dept)}
                      disabled={loading}
                    />
                    <span>{dept}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="admin-panel-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" disabled={loading || !dealershipName || selectedDepartments.length === 0}>
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
