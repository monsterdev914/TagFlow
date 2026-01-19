/**
 * Database Helper Functions
 * Utility functions for database operations
 */

import { getPool } from '../database/connection';
import { DatabaseError } from './errors';

/**
 * Ensure database connection is available
 */
export async function ensureConnection(): Promise<void> {
  const pool = getPool();
  // Connection is already established, just verify
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

/**
 * Execute a query and return results
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    throw new DatabaseError(
      `Database query error: ${(error as Error).message}`
    );
  }
}

/**
 * Execute a query and return first result
 */
export async function executeQueryOne<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
}
