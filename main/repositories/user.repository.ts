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

  /**
   * Update user username and/or password
   */
  async update(id: number, data: { username?: string; password?: string }): Promise<UserResult> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.username !== undefined) {
        updates.push('Username = ?');
        values.push(data.username);
      }
      if (data.password !== undefined) {
        updates.push('Password = ?');
        values.push(data.password);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: 'No fields to update',
        };
      }

      values.push(id);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE Id = ?
      `;

      const { getPool } = await import('../database/connection');
      const pool = getPool();
      await pool.execute(query, values);

      // Fetch updated user
      const updatedQuery = `
        SELECT 
          Id,
          Username,
          Password
        FROM users
        WHERE Id = ?
      `;

      const updatedRow = await executeQueryOne<{ Id: number; Username: string; Password: string }>(
        updatedQuery,
        [id]
      );

      if (!updatedRow) {
        return {
          success: false,
          error: 'User not found after update',
        };
      }

      const user: User = {
        id: updatedRow.Id,
        username: updatedRow.Username,
        password: updatedRow.Password,
      };

      return {
        success: true,
        user,
      };
    } catch (error) {
      console.error('Database updateUser error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
