/**
 * Database IPC Handlers
 * Handles database-related IPC requests
 */

import { ipcMain } from 'electron';
import { DatabaseService } from '../services/database.service';
import { formatError } from '../utils/errors';

export function setupDatabaseHandlers(databaseService: DatabaseService): void {
  // Database connection status handler
  ipcMain.handle('check-db-status', async () => {
    try {
      return await databaseService.checkConnectionStatus();
    } catch (error) {
      return formatError(error);
    }
  });
}
