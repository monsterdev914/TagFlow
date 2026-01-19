/**
 * Configuration Manager
 * Handles environment variables and configuration for both dev and production
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

let configLoaded = false;

/**
 * Get the configuration file path
 * In dev: .env in project root
 * In production: config.env in installation directory (same folder as .exe)
 */
function getConfigPath(): string {
    if (process.env.ELECTRON_START_URL) {
        // Development mode - use .env in project root
        return path.join(process.cwd(), '.env');
    } else {
        // Production mode - use config.env in installation directory (same folder as executable)
        const execDir = path.dirname(process.execPath);
        return path.join(execDir, 'config.env');
    }
}

/**
 * Get the example config file path
 */
function getExampleConfigPath(): string {
    if (process.env.ELECTRON_START_URL) {
        // Development mode
        return path.join(process.cwd(), '.env.example');
    } else {
        // Production mode - .env.example should be in the installation directory (same folder as executable)
        const execDir = path.dirname(process.execPath);
        return path.join(execDir, '.env.example');
    }
}

/**
 * Load configuration from file
 */
export function loadConfig(): void {
    if (configLoaded) {
        return;
    }

    const configPath = getConfigPath();
    const examplePath = getExampleConfigPath();

    // If config file doesn't exist, try to create it from example
    if (!fs.existsSync(configPath)) {
        if (fs.existsSync(examplePath)) {
            try {
                fs.copyFileSync(examplePath, configPath);
                console.log(`Created config file from example: ${configPath}`);
            } catch (error) {
                console.warn(`Failed to create config file from example: ${error}`);
            }
        }
    }

    // Load environment variables from config file
    if (fs.existsSync(configPath)) {
        // Override existing env vars to ensure config.env takes precedence
        const result = dotenv.config({ path: configPath, override: true });
        if (result.error) {
            console.warn(`Failed to load config file: ${result.error}`);
        } else {
            console.log(`Loaded config from: ${configPath}`);
            // Log loaded values for debugging (without password)
            console.log(`DB_SERVER: ${process.env.DB_SERVER || 'not set (using default: localhost)'}`);
            console.log(`DB_PORT: ${process.env.DB_PORT || 'not set (using default: 3306)'}`);
            console.log(`DB_NAME: ${process.env.DB_NAME || 'not set (using default: tagflow_db)'}`);
            console.log(`DB_USER: ${process.env.DB_USER || 'not set (using default: root)'}`);
        }
    } else {
        console.warn(`Config file not found: ${configPath}`);
        console.warn('Using default database configuration (localhost)');
    }

    configLoaded = true;
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
    return {
        host: process.env.DB_SERVER || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME || 'tagflow_db',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    };
}
