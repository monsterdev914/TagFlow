/**
 * Printing IPC Handlers
 * Handles printing-related IPC requests
 */

import { ipcMain, app } from 'electron';
import { PrintingService } from '../services/printing.service';
import { formatError } from '../utils/errors';

export function setupPrintingHandlers(printingService: PrintingService): void {
  // Generate EPCs and send to printer handler
  ipcMain.handle(
    'generate-and-print',
    async (
      event,
      params: {
        items: Array<{
          itemId: number;
          quantity: number;
        }>;
      }
    ) => {
      try {
        return await printingService.generateAndPrint(params);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}

// Close app handler (not really printing-related, but kept here for now)
export function setupAppHandlers(): void {
  ipcMain.handle('close-app', async () => {
    app.quit();
  });
}
