import { HttpResponseInit } from '@azure/functions';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

export function addCorsHeaders(response: HttpResponseInit, origin?: string | null): HttpResponseInit {
  const headers: { [key: string]: string } = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (ALLOWED_ORIGINS.includes('*') || (origin && ALLOWED_ORIGINS.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  }

  return {
    ...response,
    headers: {
      ...response.headers,
      ...headers,
    },
  };
}

export function handleOptionsRequest(): HttpResponseInit {
  return {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  };
}
