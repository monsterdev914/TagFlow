/**
 * Database Connection and Item Master Lookup
 * Configure this based on your MySQL database setup
 */

import * as mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { ensureDatabaseExists, runMigrations } from './migrations';
import { ProductionLineType } from '@/types';
dotenv.config();

const dbConfig = {
  host: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'tagflow_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

let pool: mysql.Pool | null = null;

/**
 * Initialize database connection pool and run migrations
 */
export async function initDatabase(): Promise<void> {
  const USE_MOCK_DB = !process.env.DB_SERVER;

  if (USE_MOCK_DB) {
    console.log('Using mock database mode (DB_SERVER not set)');
    return;
  }

  try {
    // Step 1: Ensure database exists
    await ensureDatabaseExists();

    // Step 2: Create connection pool
    if (!pool) {
      pool = mysql.createPool(dbConfig);
      console.log('Database connection pool created');
    }

    // Step 3: Test the connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('Database connection established');

    // Step 4: Run migrations
    await runMigrations(pool);
    console.log('Database migrations completed successfully');

  } catch (error) {
    console.error('Database initialization error:', error);
    const mysqlError = error as any;
    if (mysqlError.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('MySQL Authentication Error:');
      console.error('  - Check your DB_USER and DB_PASSWORD in .env file');
      console.error('  - Verify MySQL user has proper permissions');
      console.error('  - To use mock mode, remove DB_SERVER from .env');
    }
    throw error;
  }
}

/**
 * Get all production lines from database
 */
export async function getProductionLines(): Promise<{
  success: boolean;
  productionLines?: Array<{ id: number; name: string }>;
  error?: string;
}> {
  try {
    if (!pool) {
      await initDatabase();
    }

    if (!pool) {
      return {
        success: false,
        error: 'Database connection not available',
      };
    }

    const query = `SELECT Id, Name FROM ProductionLines ORDER BY Id`;

    const [rows] = await pool.execute(query);

    const productionLines = (rows as any[]).map((row) => ({
      id: row.Id,
      name: row.Name,
    }));

    return {
      success: true,
      productionLines,
    };
  } catch (error) {
    console.error('Database getProductionLines error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get all items from ItemMaster with production line information
 */
export async function getItems(filters?: {
  code?: string;
  description?: string;
  productionLineIds?: number[];
}): Promise<{
  success: boolean;
  items?: Array<{
    id: number;
    code: string;
    description1: string;
    description2: string;
    unitOfMeasure: string;
    identifier: string;
    productionLine: { id: number; name: string } | null;
  }>;
  error?: string;
}> {
  try {
    if (!pool) {
      await initDatabase();
    }

    if (!pool) {
      return {
        success: false,
        error: 'Database connection not available',
      };
    }

    let query = `
      SELECT 
        im.Id,
        im.Code,
        im.Description1,
        im.Description2,
        im.UnitOfMeasure,
        im.Identifier,
        im.ProductionLineId,
        pl.Id AS ProductionLineId,
        pl.Name AS ProductionLineName
      FROM ItemMaster im
      LEFT JOIN ProductionLines pl ON im.ProductionLineId = pl.Id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.code) {
      query += ` AND im.Code LIKE ?`;
      params.push(`%${filters.code}%`);
    }

    if (filters?.description) {
      query += ` AND (im.Description1 LIKE ? OR im.Description2 LIKE ?)`;
      params.push(`%${filters.description}%`, `%${filters.description}%`);
    }

    if (filters?.productionLineIds && filters.productionLineIds.length > 0) {
      query += ` AND im.ProductionLineId IN (${filters.productionLineIds.map(() => '?').join(',')})`;
      params.push(...filters.productionLineIds);
    }

    query += ` ORDER BY im.Code`;

    const [rows] = await pool.execute(query, params);

    const items = (rows as any[]).map((row) => ({
      id: row.Id,
      code: row.Code,
      description1: row.Description1 || '',
      description2: row.Description2 || '',
      unitOfMeasure: row.UnitOfMeasure || '',
      identifier: row.Identifier || row.Code,
      productionLine: row.ProductionLineId
        ? { id: row.ProductionLineId, name: row.ProductionLineName || '' }
        : null,
    }));

    return {
      success: true,
      items,
    };
  } catch (error) {
    console.error('Database getItems error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Lookup item in Item Master database by code
 */
export async function lookupItem(id: number): Promise<{
  success: boolean;
  item?: { code: string; description: string; description1?: string; description2?: string; productionLine: ProductionLineType;[key: string]: any };
  error?: string;
}> {
  try {
    if (!pool) {
      await initDatabase();
    }

    if (!pool) {
      return {
        success: false,
        error: 'Database connection not available',
      };
    }

    const query = `
      SELECT 
        im.Id,
        im.Code,
        im.Description1,
        im.Description2,
        im.UnitOfMeasure,
        im.Identifier,
        pl.Name AS ProductionLineName
      FROM ItemMaster im
      LEFT JOIN ProductionLines pl ON im.ProductionLineId = pl.Id
      WHERE im.Id = ?
    `;

    const [rows] = await pool.execute(query, [id]);

    if (Array.isArray(rows) && rows.length === 0) {
      return {
        success: false,
        error: 'Item not found in database',
      };
    }

    const item = (rows as any[])[0];
    return {
      success: true,
      item: {
        code: item.Code,
        description: item.Description1 || item.Description2 || '',
        description1: item.Description1 || '',
        description2: item.Description2 || '',
        unitOfMeasure: item.UnitOfMeasure || '',
        identifier: item.Identifier || item.Code,
        productionLineName: item.ProductionLineName || '',
        ...item,
      },
    };
  } catch (error) {
    console.error('Database lookup error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Check database connection status
 */
export async function checkConnectionStatus(): Promise<{
  connected: boolean;
  mode: 'database' | 'mock';
  error?: string;
  server?: string;
  database?: string;
}> {
  const USE_MOCK_DB = !process.env.DB_SERVER;

  if (USE_MOCK_DB) {
    return {
      connected: true,
      mode: 'mock',
      server: 'Mock Mode',
      database: 'Using mock data',
    };
  }

  try {
    if (!pool) {
      // Try to initialize connection
      try {
        await initDatabase();
      } catch (error) {
        return {
          connected: false,
          mode: 'database',
          error: (error as Error).message,
          server: dbConfig.host,
          database: dbConfig.database,
        };
      }
    }

    if (!pool) {
      return {
        connected: false,
        mode: 'database',
        error: 'Failed to initialize connection pool',
        server: dbConfig.host,
        database: dbConfig.database,
      };
    }

    // Test the connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    return {
      connected: true,
      mode: 'database',
      server: dbConfig.host,
      database: dbConfig.database,
    };
  } catch (error) {
    return {
      connected: false,
      mode: 'database',
      error: (error as Error).message,
      server: dbConfig.host,
      database: dbConfig.database,
    };
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

/**
 * Mock functions for testing when database is not available
 */
export async function mockGetProductionLines(): Promise<{
  success: boolean;
  productionLines?: Array<{ id: number; name: string }>;
  error?: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    success: true,
    productionLines: [
      { id: 1, name: 'Drum 208L Line' },
      { id: 2, name: 'OCME 1L Line' },
      { id: 3, name: '1L - 4/5L Line' },
    ],
  };
}

export async function mockGetItems(filters?: {
  code?: string;
  description?: string;
  productionLineIds?: number[];
}): Promise<{
  success: boolean;
  items?: Array<{
    id: number;
    code: string;
    description1: string;
    description2: string;
    unitOfMeasure: string;
    identifier: string;
    productionLine: { id: number; name: string } | null;
  }>;
  error?: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const mockItems = [
    { id: 1, code: 'A001', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A001', productionLineId: 1 },
    { id: 2, code: 'A002', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A002', productionLineId: 2 },
    { id: 3, code: 'A003', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A003', productionLineId: 3 },
    { id: 4, code: 'A004', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A004', productionLineId: 1 },
    { id: 5, code: 'A005', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A005', productionLineId: 2 },
    { id: 6, code: 'A006', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A006', productionLineId: 3 },
    { id: 7, code: 'A007', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A007', productionLineId: 2 },
    { id: 8, code: 'A008', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A008', productionLineId: 3 },
    { id: 9, code: 'A009', description1: 'Item Description 1', description2: 'Item Description 2', unitOfMeasure: 'PCS', identifier: 'A009', productionLineId: 1 },
  ];

  const productionLines = [
    { id: 1, name: 'Drum 208L Line' },
    { id: 2, name: 'OCME 1L Line' },
    { id: 3, name: '1L - 4/5L Line' },
  ];

  let filtered = mockItems;

  if (filters?.code) {
    filtered = filtered.filter((item) => item.code.toLowerCase().includes(filters.code!.toLowerCase()));
  }

  if (filters?.description) {
    const descLower = filters.description.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.description1.toLowerCase().includes(descLower) ||
        item.description2.toLowerCase().includes(descLower)
    );
  }

  if (filters?.productionLineIds && filters.productionLineIds.length > 0) {
    filtered = filtered.filter((item) => filters.productionLineIds!.includes(item.productionLineId));
  }

  const items = filtered.map((item) => ({
    id: item.id,
    code: item.code,
    description1: item.description1,
    description2: item.description2,
    unitOfMeasure: item.unitOfMeasure,
    identifier: item.identifier,
    productionLine: productionLines.find((pl) => pl.id === item.productionLineId) || null,
  }));

  return {
    success: true,
    items,
  };
}

export async function mockLookupItem(itemCode: string): Promise<{
  success: boolean;
  item?: { code: string; description: string; description1?: string; description2?: string };
  error?: string;
}> {
  // Mock data for testing
  const mockItems: { [key: string]: { description1: string; description2: string } } = {
    '12345': { description1: 'Sample Item A - Widget', description2: 'Widget Description' },
    '67890': { description1: 'Sample Item B - Gadget', description2: 'Gadget Description' },
    '11111': { description1: 'Test Item - Production Sample', description2: 'Test Description' },
  };

  await new Promise((resolve) => setTimeout(resolve, 200)); // Simulate network delay

  if (mockItems[itemCode]) {
    return {
      success: true,
      item: {
        code: itemCode,
        description: mockItems[itemCode].description1,
        description1: mockItems[itemCode].description1,
        description2: mockItems[itemCode].description2,
      },
    };
  }

  return {
    success: false,
    error: 'Item not found',
  };
}

export async function getUserByUsername(username: string): Promise<{
  success: boolean;
  user?: { id: number; username: string; password: string };
  error?: string;
}> {
  try {
    if (!pool) {
      await initDatabase();
    }

    if (!pool) {
      return {
        success: false,
        error: 'Database connection not available',
      };
    }

    const query = `
      SELECT 
        Id,
        Username,
        Password
      FROM users
      WHERE Username = ?
    `;

    const [rows] = await pool.execute(query, [username]);

    if (Array.isArray(rows) && rows.length === 0) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const user = (rows as any[])[0];
    return {
      success: true,
      user: {
        id: user.Id,
        username: user.Username,
        password: user.Password,
      },
    };
  } catch (error) {
    console.error('Database getUserByUsername error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
