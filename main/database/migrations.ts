/**
 * Database Migration Scripts
 * Runs automatically on database initialization
 */

import * as mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../config';

/**
 * Create database if it doesn't exist
 */
export async function ensureDatabaseExists(): Promise<void> {
  const dbConfig = getDatabaseConfig();

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

    // Create PrintingHistory table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS PrintingHistory (
        Id INT AUTO_INCREMENT PRIMARY KEY,
        ItemId INT NOT NULL,
        ItemCode VARCHAR(50) NOT NULL,
        ItemDescription VARCHAR(500),
        ProductionLineId INT,
        ProductionLineName VARCHAR(100),
        Quantity INT NOT NULL,
        EpcsGenerated INT NOT NULL,
        PrinterIP VARCHAR(50),
        PrinterPort INT,
        PrinterName VARCHAR(100),
        Status VARCHAR(50) NOT NULL DEFAULT 'success',
        ErrorMessage TEXT,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ItemId) REFERENCES ItemMaster(Id) ON DELETE CASCADE,
        FOREIGN KEY (ProductionLineId) REFERENCES ProductionLines(Id) ON DELETE SET NULL,
        INDEX idx_item_id (ItemId),
        INDEX idx_production_line_id (ProductionLineId),
        INDEX idx_created_at (CreatedAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('PrintingHistory table migration completed');
  } finally {
    connection.release();
  }
}
