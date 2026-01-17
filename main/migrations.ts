/**
 * Database Migration Scripts
 * Runs automatically on database initialization
 */

import * as mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbConfig = {
    host: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'tagflow_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
};

/**
 * Create database if it doesn't exist
 */
export async function ensureDatabaseExists(): Promise<void> {
    // Connect without specifying database
    const tempConfig = {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
    };

    const tempConnection = await mysql.createConnection(tempConfig);

    try {
        // Create database if it doesn't exist
        await tempConnection.execute(
            `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`Database '${dbConfig.database}' ensured`);
    } finally {
        await tempConnection.end();
    }
}

/**
 * Run all database migrations
 */
export async function runMigrations(pool: mysql.Pool): Promise<void> {
    const connection = await pool.getConnection();

    try {
        // Create ProductionLines table (reference table)
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS ProductionLines (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL UNIQUE,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('ProductionLines table migration completed');

        // Insert default production lines if they don't exist
        await connection.execute(`
      INSERT IGNORE INTO ProductionLines (Id, Name) VALUES
      (1, 'Drum 208L Line'),
      (2, 'OCME 1L Line'),
      (3, '1L - 4/5L Line')
    `);
        console.log('Default production lines ensured');

        // Create ItemMaster table with all necessary columns
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS ItemMaster (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Code VARCHAR(50) NOT NULL,
        Description1 VARCHAR(500),
        Description2 VARCHAR(500),
        UnitOfMeasure VARCHAR(20),
        Identifier VARCHAR(100),
        ProductionLineId INT,
        FOREIGN KEY (ProductionLineId) REFERENCES ProductionLines(Id) ON DELETE SET NULL,
        INDEX idx_production_line (ProductionLineId),
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('ItemMaster table migration completed');

        await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        Username VARCHAR(50) NOT NULL UNIQUE,
        Password VARCHAR(50) NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('users table migration completed');

        await connection.execute(`
      INSERT IGNORE INTO users (Id, Username, Password) VALUES
      (1, 'admin', 'admin'),
      (2, 'user', 'user')
    `);
        console.log('Default users ensured');
    } finally {
        connection.release();
    }
}
