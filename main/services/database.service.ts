/**
 * Database Service
 * Service for database connection status and management
 */

import { getPool } from '../database/connection';
import { getDatabaseConfig } from '../config';
import { DatabaseStatus } from '../types';

export class DatabaseService {
  /**
   * Check database connection status
   */
  async checkConnectionStatus(): Promise<DatabaseStatus> {
    try {
      const pool = getPool();
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();

      const dbConfig = getDatabaseConfig();

      return {
        connected: true,
        mode: 'database',
        server: dbConfig.host,
        database: dbConfig.database,
      };
    } catch (error) {
      const dbConfig = getDatabaseConfig();
      return {
        connected: false,
        mode: 'database',
        error: (error as Error).message,
        server: dbConfig.host,
        database: dbConfig.database,
      };
    }
  }
}
