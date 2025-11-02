import sql from 'mssql';
import { config } from '../local.settings.json';

let pool: sql.ConnectionPool | null = null;

const sqlConfig: sql.config = {
  server: process.env.SQL_SERVER || config?.Values?.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || config?.Values?.SQL_DATABASE || '',
  user: process.env.SQL_USER || config?.Values?.SQL_USER || '',
  password: process.env.SQL_PASSWORD || config?.Values?.SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(sqlConfig);
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

export async function executeQuery<T = any>(
  query: string,
  parameters?: { [key: string]: any }
): Promise<T[]> {
  const pool = await getPool();
  const request = pool.request();

  if (parameters) {
    Object.keys(parameters).forEach((key) => {
      request.input(key, parameters[key]);
    });
  }

  const result = await request.query(query);
  return result.recordset as T[];
}

export async function executeScalar<T = any>(
  query: string,
  parameters?: { [key: string]: any }
): Promise<T | null> {
  const pool = await getPool();
  const request = pool.request();

  if (parameters) {
    Object.keys(parameters).forEach((key) => {
      request.input(key, parameters[key]);
    });
  }

  const result = await request.query(query);
  return result.recordset[0]?.[0] ?? null;
}
