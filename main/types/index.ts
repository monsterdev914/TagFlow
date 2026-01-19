/**
 * Shared Types and Interfaces
 * Central location for type definitions used across the application
 */

// Database Connection Status
export interface DatabaseStatus {
    connected: boolean;
    mode: 'database';
    error?: string;
    server?: string;
    database?: string;
}

// Production Line
export interface ProductionLine {
    id: number;
    name: string;
}

// Item Master
export interface Item {
    id: number;
    code: string;
    description: string;
    description1: string;
    description2: string;
    unitOfMeasure: string;
    identifier: string;
    productionLine: ProductionLine | null;
    productionLineId: number | null;
    productionLineName: string;
}

// User
export interface User {
    id: number;
    username: string;
    password: string;
}

// Database Result Types
export interface DatabaseResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ItemsResult extends DatabaseResult<Item[]> {
    items?: Item[];
}

export interface ProductionLinesResult extends DatabaseResult<ProductionLine[]> {
    productionLines?: ProductionLine[];
}

export interface ItemResult extends DatabaseResult<Item> {
    item?: Item;
}

export interface UserResult extends DatabaseResult<User> {
    user?: User;
}

// Authentication
export interface LoginResult {
    success: boolean;
    error?: string;
}

// Printing
export interface PrintParams {
    items: Array<{
        itemId: number;
        quantity: number;
    }>;
}

export interface PrintResult {
    success: boolean;
    epcsGenerated?: number;
    message?: string;
    error?: string;
}
