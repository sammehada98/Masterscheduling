import { jwtDecode } from 'jwt-decode';
import type { UserAccess, AuthResponse, CodeType, Department } from '../types';
import { apiService } from './api';

interface TokenPayload {
  linkId: string;
  codeType: CodeType;
  uniqueIdentifier: string;
  departments?: Department[];
  exp: number;
  iat: number;
}

class AuthService {
  private currentUser: UserAccess | null = null;

  /**
   * Store authentication token and user info
   */
  setAuth(authResponse: AuthResponse): void {
    localStorage.setItem('auth_token', authResponse.token);
    
    const userAccess: UserAccess = {
      codeType: authResponse.codeType,
      departments: authResponse.departments || [],
      linkId: '',
      uniqueIdentifier: '',
    };

    // Decode token to get full user info
    try {
      const decoded = jwtDecode<TokenPayload>(authResponse.token);
      userAccess.linkId = decoded.linkId;
      userAccess.uniqueIdentifier = decoded.uniqueIdentifier;
      userAccess.departments = decoded.departments || authResponse.departments || [];
      userAccess.language = decoded.language || (authResponse as any).language;
      userAccess.dealershipName = decoded.dealershipName || (authResponse as any).dealershipName;
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    localStorage.setItem('user_access', JSON.stringify(userAccess));
    this.currentUser = userAccess;
  }

  /**
   * Get current user access info
   */
  getCurrentUser(): UserAccess | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const stored = localStorage.getItem('user_access');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch (error) {
        console.error('Error parsing user access:', error);
      }
    }

    return null;
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const now = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < now) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is trainer (can edit)
   */
  isTrainer(): boolean {
    const user = this.getCurrentUser();
    return user?.codeType === 'trainer';
  }

  /**
   * @deprecated Use isTrainer() instead
   */
  isAdmin(): boolean {
    return this.isTrainer();
  }

  /**
   * Check if user can access department
   */
  canAccessDepartment(department: Department): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (user.codeType === 'trainer') return true;
    
    return user.departments.includes(department);
  }

  /**
   * Get accessible departments
   */
  getAccessibleDepartments(): Department[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    if (user.codeType === 'trainer') {
      return ['Parts', 'Service', 'Sales', 'Accounting'];
    }
    
    return user.departments;
  }

  /**
   * Validate code and authenticate
   */
  async validateCode(uniqueIdentifier: string, code: string): Promise<AuthResponse> {
    const response = await apiService.validateCode(uniqueIdentifier, code);
    if (response.success) {
      this.setAuth(response);
    }
    return response;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_access');
    this.currentUser = null;
  }

  /**
   * Refresh user info from server
   */
  async refreshUserInfo(): Promise<void> {
    try {
      const linkInfo = await apiService.getLink();
      const user = this.getCurrentUser();
      
      if (user) {
        user.departments = linkInfo.access.departments;
        localStorage.setItem('user_access', JSON.stringify(user));
        this.currentUser = user;
      }
    } catch (error) {
      console.error('Error refreshing user info:', error);
    }
  }
}

export const authService = new AuthService();
