export type Department = 'Parts' | 'Service' | 'Sales' | 'Accounting';

export type CodeType = 'trainer' | 'customer';

export interface Session {
  id: string;
  linkId: string;
  department: Department;
  sessionCode: string;
  sessionName: string;
  description?: string | null;
  academyCourse?: string | null;
  attendeeType?: string | null;
  startDateTime: string; // ISO string
  duration: number; // minutes
  sessionCount: number;
  createdBy?: string;
  updatedAt?: string;
}

export interface Template {
  id: string;
  department: Department;
  sessionCode: string;
  sessionName: string;
  description?: string | null;
  academyCourse?: string | null;
  defaultAttendeeType?: string | null;
  defaultDuration: number; // minutes
  createdAt?: string;
}

export interface Link {
  id: string;
  uniqueIdentifier: string;
  createdAt: string;
}

export interface DepartmentInfo {
  name: Department;
  color: string;
}

export interface UserAccess {
  codeType: CodeType;
  departments: Department[];
  linkId: string;
  uniqueIdentifier: string;
  language?: string;
  dealershipName?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  codeType: CodeType;
  accessLevel: 'full' | 'view';
  departments?: Department[];
}

export interface LinkInfo {
  link: Link;
  access: {
    codeType: CodeType;
    departments: Department[];
  };
}

export interface CreateSessionInput {
  department: Department;
  sessionCode: string;
  sessionName: string;
  description?: string | null;
  academyCourse?: string | null;
  attendeeType?: string | null;
  startDateTime: string;
  duration: number;
  sessionCount: number;
}

export interface UpdateSessionInput extends CreateSessionInput {
  id: string;
}

export interface CreateTemplateInput {
  id?: string;
  department: Department;
  sessionCode: string;
  sessionName: string;
  description?: string | null;
  academyCourse?: string | null;
  defaultAttendeeType?: string | null;
  defaultDuration: number;
}

export interface CreateLinkInput {
  dealershipName: string;
  language: 'en' | 'fr';
  trainerCode?: string;
  customerCode?: string;
  customerDepartments: Department[];
}
