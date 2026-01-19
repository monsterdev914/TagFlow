/**
 * Item IPC Handlers
 * Handles item-related IPC requests
 */

import { ipcMain } from 'electron';
import { ItemService } from '../services/item.service';
import { formatError } from '../utils/errors';

export function setupItemHandlers(itemService: ItemService): void {
  // Get items handler
  ipcMain.handle(
    'get-items',
    async (
      event,
      filters?: {
        code?: string;
        description?: string;
        productionLineIds?: number[];
      }
    ) => {
      try {
        return await itemService.getItems(filters);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // Item lookup handler
  ipcMain.handle('lookup-item', async (event, id: number) => {
    try {
      return await itemService.getItemById(id);
    } catch (error) {
      return formatError(error);
    }
  });

  // Create item handler
  ipcMain.handle(
    'create-item',
    async (
      event,
      data: {
        code: string;
        description1?: string;
        description2?: string;
        unitOfMeasure?: string;
        identifier?: string;
        productionLineId?: number | null;
      }
    ) => {
      try {
        return await itemService.createItem(data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // Update item handler
  ipcMain.handle(
    'update-item',
    async (
      event,
      id: number,
      data: {
        code?: string;
        description1?: string;
        description2?: string;
        unitOfMeasure?: string;
        identifier?: string;
        productionLineId?: number | null;
      }
    ) => {
      try {
        return await itemService.updateItem(id, data);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // Delete item handler
  ipcMain.handle('delete-item', async (event, id: number) => {
    try {
      return await itemService.deleteItem(id);
    } catch (error) {
      return formatError(error);
    }
  });
}
