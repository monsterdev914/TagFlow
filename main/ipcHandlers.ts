import { ipcMain } from 'electron';
import {
    lookupItem,
    mockLookupItem,
    initDatabase,
    checkConnectionStatus,
    getProductionLines,
    mockGetProductionLines,
    getItems,
    mockGetItems,
} from './database';
import { generateEPCs } from '../shared/epcGenerator';
import { generateZPL, sendToPrinter, type PrintJob } from '../shared/printer';
import { login } from './auth';

// Use mock lookup if DB_SERVER is not set (for testing)
const USE_MOCK_DB = !process.env.DB_SERVER;

/**
 * Initialize IPC handlers
 */
export function setupIpcHandlers() {
    // Initialize database connection
    if (!USE_MOCK_DB) {
        initDatabase().catch((error) => {
            console.error('Failed to initialize database:', error);
        });
    }

    // Login handler
    ipcMain.handle('login', async (event, username: string, password: string) => {
        try {
            return await login(username, password);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });
    // Database connection status handler
    ipcMain.handle('check-db-status', async () => {
        try {
            return await checkConnectionStatus();
        } catch (error) {
            return {
                connected: false,
                mode: 'database' as const,
                error: (error as Error).message,
            };
        }
    });

    // Get production lines handler
    ipcMain.handle('get-production-lines', async () => {
        try {
            if (USE_MOCK_DB) {
                return await mockGetProductionLines();
            }
            return await getProductionLines();
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    });

    // Get items handler
    ipcMain.handle('get-items', async (event, filters?: {
        code?: string;
        description?: string;
        productionLineIds?: number[];
    }) => {
        try {
            if (USE_MOCK_DB) {
                return await mockGetItems(filters);
            }
            return await getItems(filters);
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    });

    // Item lookup handler
    ipcMain.handle('lookup-item', async (event, id: number) => {
        try {
            return await lookupItem(id);
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    });

    // Generate EPCs and send to printer handler
    ipcMain.handle(
        'generate-and-print',
        async (
            event,
            params: {
                productionLine: number;
                itemId: number;
                quantity: number;
            }
        ) => {
            try {
                const { productionLine, itemId, quantity } = params;

                // Step 1: Validate item exists
                const itemLookup = await lookupItem(itemId);

                if (!itemLookup.success || !itemLookup.item) {
                    return {
                        success: false,
                        error: itemLookup.error || 'Item not found',
                    };
                }

                // Step 2: Generate EPCs
                const epcs = generateEPCs({
                    itemNumber: itemLookup.item.code,
                    quantity,
                    companyPrefix: process.env.COMPANY_PREFIX || '000000000000',
                    serialStart: 1,
                });

                // Step 3: Generate ZPL print job
                const printJob: PrintJob = {
                    epcs,
                    itemNumber: itemLookup.item.code,
                    itemDescription: itemLookup.item.description,
                    productionLine: itemLookup.item.productionLineName,
                };

                const zpl = generateZPL(printJob);

                // Step 4: Send to printer
                // Configure printer based on production line
                const printerConfig = {
                    productionLine: itemLookup.item.productionLineName,
                    printerIP: process.env[`PRINTER_IP_LINE_${productionLine}`],
                    printerPort: parseInt(
                        process.env[`PRINTER_PORT_LINE_${productionLine}`] || '9100'
                    ),
                    printerName: process.env[`PRINTER_NAME_LINE_${productionLine}`],
                };

                const printResult = await sendToPrinter(zpl, printerConfig);

                if (!printResult.success) {
                    return {
                        success: false,
                        error: printResult.error || 'Failed to send to printer',
                    };
                }

                return {
                    success: true,
                    epcsGenerated: epcs.length,
                    message: printResult.error || 'Print job sent successfully',
                };
            } catch (error) {
                return {
                    success: false,
                    error: (error as Error).message,
                };
            }
        }
    );
}
