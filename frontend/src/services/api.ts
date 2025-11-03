import axios, { AxiosInstance } from 'axios';
import type {
  Session,
  Template,
  LinkInfo,
  CreateSessionInput,
  UpdateSessionInput,
  CreateTemplateInput,
  CreateLinkInput,
  Department,
  DepartmentInfo,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_access');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async validateCode(uniqueIdentifier: string, code: string) {
    const response = await this.client.post('/auth/validateCode', {
      uniqueIdentifier,
      code,
    });
    return response.data;
  }

  // Links
  async getLink(): Promise<LinkInfo> {
    const response = await this.client.get('/links/getLink');
    return response.data;
  }

  async createLink(data: CreateLinkInput) {
    const response = await this.client.post('/links/createLink', data);
    return response.data;
  }

  async listLinks(auth: { username: string; password: string }) {
    const response = await this.client.post('/links/listLinks', auth);
    return response.data;
  }

  // Sessions
  async getSessions(department?: Department): Promise<{ sessions: Session[] }> {
    const params = department ? { department } : {};
    const response = await this.client.get('/sessions/getSessions', { params });
    return response.data;
  }

  async createSession(data: CreateSessionInput): Promise<{ session: Session }> {
    const response = await this.client.post('/sessions/createSession', data);
    return response.data;
  }

  async updateSession(id: string, data: CreateSessionInput): Promise<{ session: Session }> {
    const response = await this.client.put(`/sessions/updateSession?id=${id}`, data);
    return response.data;
  }

  async deleteSession(id: string): Promise<{ success: boolean }> {
    const response = await this.client.delete(`/sessions/deleteSession?id=${id}`);
    return response.data;
  }

  // Templates
  async getTemplates(department?: Department): Promise<{ templates: Template[] }> {
    const params = department ? { department } : {};
    const response = await this.client.get('/templates/getTemplates', { params });
    return response.data;
  }

  async saveTemplate(data: CreateTemplateInput): Promise<{ template: Template }> {
    const response = await this.client.post('/templates/saveTemplate', data);
    return response.data;
  }

  async manageTemplates(auth: { username: string; password: string }, action: 'list' | 'create' | 'delete', data?: any) {
    if (action === 'list') {
      const response = await this.client.get('/templates/manageTemplates', {
        params: data?.department ? { department: data.department } : {},
      });
      return response.data;
    } else if (action === 'create') {
      const response = await this.client.post('/templates/manageTemplates', {
        ...auth,
        ...data,
      });
      return response.data;
    } else if (action === 'delete') {
      const response = await this.client.post('/templates/manageTemplates', {
        ...auth,
        templateId: data.templateId,
      });
      return response.data;
    }
  }

  // Departments
  async getDepartments(): Promise<{ departments: DepartmentInfo[] }> {
    const response = await this.client.get('/departments/getDepartments');
    return response.data;
  }

  // Calendar
  async exportCalendar(department?: Department): Promise<Blob> {
    const params = department ? { department } : {};
    const response = await this.client.get('/calendar/exportCalendar', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiService = new ApiService();
