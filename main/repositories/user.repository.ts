/**
 * User Repository
 * Data access layer for Users
 */

import { executeQueryOne } from '../utils/db-helpers';
import { User, UserResult } from '../types';

export class UserRepository {
  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<UserResult> {
    try {
      const query = `
        SELECT 
          Id,
          Username,
          Password
        FROM users
        WHERE Username = ?
      `;

      const row = await executeQueryOne<{ Id: number; Username: string; Password: string }>(
        query,
        [username]
      );

      if (!row) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const user: User = {
        id: row.Id,
        username: row.Username,
        password: row.Password,
      };

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Database getUserByUsername error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
