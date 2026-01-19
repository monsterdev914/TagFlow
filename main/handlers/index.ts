/**
 * IPC Handlers Registry
 * Central location to register all IPC handlers
 */

import { initDatabase, getPool } from '../database/connection';
import { ensureDatabaseExists, runMigrations } from '../database/migrations';

// Repositories
import { UserRepository } from '../repositories/user.repository';
import { ItemRepository } from '../repositories/item.repository';
import { ProductionLineRepository } from '../repositories/production-line.repository';
import { PrintingHistoryRepository } from '../repositories/printing-history.repository';

// Services
import { AuthService } from '../services/auth.service';
import { ItemService } from '../services/item.service';
import { ProductionLineService } from '../services/production-line.service';
import { PrintingService } from '../services/printing.service';
import { PrintingHistoryService } from '../services/printing-history.service';
import { DatabaseService } from '../services/database.service';

// Handlers
import { setupAuthHandlers } from './auth.handler';
import { setupDatabaseHandlers } from './database.handler';
import { setupItemHandlers } from './item.handler';
import { setupProductionLineHandlers } from './production-line.handler';
import { setupPrintingHandlers, setupAppHandlers } from './printing.handler';

/**
 * Initialize and setup all IPC handlers
 */
export async function setupIpcHandlers(): Promise<void> {
  // Initialize database connection and run migrations
  await ensureDatabaseExists();
  await initDatabase();
  const pool = getPool();
  await runMigrations(pool);

  // Initialize repositories
  const userRepository = new UserRepository();
  const itemRepository = new ItemRepository();
  const productionLineRepository = new ProductionLineRepository();
  const printingHistoryRepository = new PrintingHistoryRepository();

  // Initialize services
  const authService = new AuthService(userRepository);
  const itemService = new ItemService(itemRepository);
  const productionLineService = new ProductionLineService(productionLineRepository);
  const printingService = new PrintingService(itemRepository, printingHistoryRepository);
  const printingHistoryService = new PrintingHistoryService(printingHistoryRepository);
  const databaseService = new DatabaseService();

  // Setup handlers
  setupAuthHandlers(authService);
  setupDatabaseHandlers(databaseService);
  setupItemHandlers(itemService);
  setupProductionLineHandlers(productionLineService);
  setupPrintingHandlers(printingService, printingHistoryService);
  setupAppHandlers();
}
