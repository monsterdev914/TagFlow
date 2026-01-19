/**
 * Database Connection Manager
 * Handles MySQL connection pool initialization and management
 */

import * as mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../config';

let pool: mysql.Pool | null = null;

/**
 * Get database configuration
 */
function getDbConfig(): mysql.PoolOptions {
    const dbConfigBase = getDatabaseConfig();
    return {
        ...dbConfigBase,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    };
}

/**
 * Initialize database connection pool
 */
export async function initDatabase(): Promise<void> {
    try {
        if (!pool) {
            const dbConfig = getDbConfig();
            pool = mysql.createPool(dbConfig);
            console.log('Database connection pool created');
        }

        // Test the connection
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('Database connection established');
    } catch (error) {
        console.error('Database initialization error:', error);
        const mysqlError = error as any;
        if (mysqlError.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('MySQL Authentication Error:');
            console.error('  - Check your DB_USER and DB_PASSWORD in config.env');
            console.error('  - Verify MySQL user has proper permissions');
        }
        throw error;
    }
}

/**
 * Get the database connection pool
 */
export function getPool(): mysql.Pool {
    if (!pool) {
        throw new Error('Database pool not initialized. Call initDatabase() first.');
    }
    return pool;
}

/**
 * Close database connection pool
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
