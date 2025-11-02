import { z } from 'zod';
import { isValidDepartment, isValidCodeFormat } from './security';

// Session validation schema
export const sessionSchema = z.object({
  department: z.enum(['Parts', 'Service', 'Sales', 'Accounting']),
  sessionCode: z.string().min(1).max(100),
  sessionName: z.string().min(1).max(255),
  description: z.string().max(5000).optional().nullable(),
  academyCourse: z.string().max(255).optional().nullable(),
  attendeeType: z.string().max(100).optional().nullable(),
  startDateTime: z.string().datetime(),
  duration: z.number().int().positive().max(1440), // Max 24 hours in minutes
  sessionCount: z.number().int().positive().default(1),
});

// Template validation schema
export const templateSchema = z.object({
  department: z.enum(['Parts', 'Service', 'Sales', 'Accounting']),
  sessionCode: z.string().min(1).max(100),
  sessionName: z.string().min(1).max(255),
  sessionNameFr: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  descriptionFr: z.string().max(5000).optional().nullable(),
  academyCourse: z.string().max(255).optional().nullable(),
  academyCourseFr: z.string().max(255).optional().nullable(),
  defaultAttendeeType: z.string().max(100).optional().nullable(),
  defaultAttendeeTypeFr: z.string().max(100).optional().nullable(),
  defaultDuration: z.number().int().positive().max(1440),
});

// Link creation validation schema
export const linkSchema = z.object({
  dealershipName: z.string().min(1).max(255),
  language: z.enum(['en', 'fr']),
  trainerCode: z.string().refine(isValidCodeFormat, {
    message: 'Trainer code must be 6-20 alphanumeric characters',
  }).optional(),
  customerCode: z.string().refine(isValidCodeFormat, {
    message: 'Customer code must be 6-20 alphanumeric characters',
  }).optional(),
  customerDepartments: z.array(z.enum(['Parts', 'Service', 'Sales', 'Accounting'])),
});

// Code validation schema
export const codeSchema = z.object({
  code: z.string().refine(isValidCodeFormat, {
    message: 'Code must be 6-20 alphanumeric characters',
  }),
});

// Validate session data
export function validateSession(data: unknown) {
  return sessionSchema.parse(data);
}

// Validate template data
export function validateTemplate(data: unknown) {
  return templateSchema.parse(data);
}

// Validate link data
export function validateLink(data: unknown) {
  return linkSchema.parse(data);
}

// Validate code
export function validateCode(data: unknown) {
  return codeSchema.parse(data);
}
