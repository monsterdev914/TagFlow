/**
 * Authentication IPC Handlers
 * Handles authentication-related IPC requests
 */

import { ipcMain } from 'electron';
import { AuthService } from '../services/auth.service';
import { formatError } from '../utils/errors';

export function setupAuthHandlers(authService: AuthService): void {
  // Login handler
  ipcMain.handle('login', async (event, username: string, password: string) => {
    try {
      return await authService.login(username, password);
    } catch (error) {
      return formatError(error);
    }
  });

  // Logout handler
  ipcMain.handle('logout', async () => {
    try {
      return await authService.logout();
    } catch (error) {
      return formatError(error);
    }
  });
}
