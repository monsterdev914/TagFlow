/**
 * Printing IPC Handlers
 * Handles printing-related IPC requests
 */

import { ipcMain, app } from 'electron';
import { PrintingService } from '../services/printing.service';
import { PrintingHistoryService } from '../services/printing-history.service';
import { PrintingHistoryFilters } from '../repositories/printing-history.repository';
import { formatError } from '../utils/errors';

export function setupPrintingHandlers(
  printingService: PrintingService,
  printingHistoryService: PrintingHistoryService
): void {
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

  // Get printing history handler
  ipcMain.handle(
    'get-printing-history',
    async (
      event,
      filters?: {
        itemId?: number;
        productionLineId?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        limit?: number;
        offset?: number;
      }
    ) => {
      try {
        const historyFilters: PrintingHistoryFilters = {};
        
        if (filters?.itemId) historyFilters.itemId = filters.itemId;
        if (filters?.productionLineId) historyFilters.productionLineId = filters.productionLineId;
        if (filters?.startDate) historyFilters.startDate = new Date(filters.startDate);
        if (filters?.endDate) historyFilters.endDate = new Date(filters.endDate);
        if (filters?.status) historyFilters.status = filters.status;
        if (filters?.limit) historyFilters.limit = filters.limit;
        if (filters?.offset) historyFilters.offset = filters.offset;

        return await printingHistoryService.getPrintingHistory(historyFilters);
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
