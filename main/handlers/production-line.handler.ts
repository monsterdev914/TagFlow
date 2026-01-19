/**
 * Production Line IPC Handlers
 * Handles production line-related IPC requests
 */

import { ipcMain } from 'electron';
import { ProductionLineService } from '../services/production-line.service';
import { formatError } from '../utils/errors';

export function setupProductionLineHandlers(
  productionLineService: ProductionLineService
): void {
  // Get production lines handler
  ipcMain.handle('get-production-lines', async () => {
    try {
      return await productionLineService.getProductionLines();
    } catch (error) {
      return formatError(error);
    }
  });

  // Create production line handler
  ipcMain.handle('create-production-line', async (event, name: string) => {
    try {
      return await productionLineService.createProductionLine(name);
    } catch (error) {
      return formatError(error);
    }
  });

  // Update production line handler
  ipcMain.handle('update-production-line', async (event, id: number, name: string) => {
    try {
      return await productionLineService.updateProductionLine(id, name);
    } catch (error) {
      return formatError(error);
    }
  });

  // Delete production line handler
  ipcMain.handle('delete-production-line', async (event, id: number) => {
    try {
      return await productionLineService.deleteProductionLine(id);
    } catch (error) {
      return formatError(error);
    }
  });
}
