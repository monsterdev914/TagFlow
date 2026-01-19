/**
 * Printing History Repository
 * Data access layer for Printing History
 */

import { executeQuery, executeQueryOne } from '../utils/db-helpers';
import { DatabaseResult } from '../types';

export interface PrintingHistoryRecord {
  id: number;
  itemId: number;
  itemCode: string;
  itemDescription: string | null;
  productionLineId: number | null;
  productionLineName: string | null;
  quantity: number;
  epcsGenerated: number;
  printerIP: string | null;
  printerPort: number | null;
  printerName: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
}

export interface CreatePrintingHistoryData {
  itemId: number;
  itemCode: string;
  itemDescription?: string | null;
  productionLineId?: number | null;
  productionLineName?: string | null;
  quantity: number;
  epcsGenerated: number;
  printerIP?: string | null;
  printerPort?: number | null;
  printerName?: string | null;
  status?: string;
  errorMessage?: string | null;
}

export interface PrintingHistoryFilters {
  itemId?: number;
  productionLineId?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface PrintingHistoryResult extends DatabaseResult<PrintingHistoryRecord[]> {
  records?: PrintingHistoryRecord[];
  total?: number;
}

export class PrintingHistoryRepository {
  /**
   * Create a new printing history record
   */
  async create(data: CreatePrintingHistoryData): Promise<DatabaseResult<PrintingHistoryRecord>> {
    try {
      const query = `
        INSERT INTO PrintingHistory (
          ItemId, ItemCode, ItemDescription, ProductionLineId, ProductionLineName,
          Quantity, EpcsGenerated, PrinterIP, PrinterPort, PrinterName,
          Status, ErrorMessage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.itemId,
        data.itemCode,
        data.itemDescription || null,
        data.productionLineId || null,
        data.productionLineName || null,
        data.quantity,
        data.epcsGenerated,
        data.printerIP || null,
        data.printerPort || null,
        data.printerName || null,
        data.status || 'success',
        data.errorMessage || null,
      ];

      const { getPool } = await import('../database/connection');
      const pool = getPool();
      const [result] = await pool.execute(query, params);
      const insertResult = result as any;

      // Fetch the created record
      const createdRecord = await this.findById(insertResult.insertId);
      if (!createdRecord) {
        return {
          success: false,
          error: 'Failed to fetch created printing history record',
        };
      }

      return {
        success: true,
        data: createdRecord,
      };
    } catch (error) {
      console.error('Database createPrintingHistory error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Find printing history record by ID
   */
  async findById(id: number): Promise<PrintingHistoryRecord | null> {
    try {
      const query = `
        SELECT 
          Id,
          ItemId,
          ItemCode,
          ItemDescription,
          ProductionLineId,
          ProductionLineName,
          Quantity,
          EpcsGenerated,
          PrinterIP,
          PrinterPort,
          PrinterName,
          Status,
          ErrorMessage,
          CreatedAt
        FROM PrintingHistory
        WHERE Id = ?
      `;

      const row = await executeQueryOne<{
        Id: number;
        ItemId: number;
        ItemCode: string;
        ItemDescription: string | null;
        ProductionLineId: number | null;
        ProductionLineName: string | null;
        Quantity: number;
        EpcsGenerated: number;
        PrinterIP: string | null;
        PrinterPort: number | null;
        PrinterName: string | null;
        Status: string;
        ErrorMessage: string | null;
        CreatedAt: Date;
      }>(query, [id]);

      if (!row) {
        return null;
      }

      return {
        id: row.Id,
        itemId: row.ItemId,
        itemCode: row.ItemCode,
        itemDescription: row.ItemDescription,
        productionLineId: row.ProductionLineId,
        productionLineName: row.ProductionLineName,
        quantity: row.Quantity,
        epcsGenerated: row.EpcsGenerated,
        printerIP: row.PrinterIP,
        printerPort: row.PrinterPort,
        printerName: row.PrinterName,
        status: row.Status,
        errorMessage: row.ErrorMessage,
        createdAt: row.CreatedAt,
      };
    } catch (error) {
      console.error('Database findPrintingHistoryById error:', error);
      return null;
    }
  }

  /**
   * Find all printing history records with optional filters
   */
  async findAll(filters?: PrintingHistoryFilters): Promise<PrintingHistoryResult> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];

      if (filters?.itemId) {
        conditions.push('ItemId = ?');
        params.push(filters.itemId);
      }

      if (filters?.productionLineId) {
        conditions.push('ProductionLineId = ?');
        params.push(filters.productionLineId);
      }

      if (filters?.startDate) {
        conditions.push('CreatedAt >= ?');
        params.push(filters.startDate);
      }

      if (filters?.endDate) {
        conditions.push('CreatedAt <= ?');
        params.push(filters.endDate);
      }

      if (filters?.status) {
        conditions.push('Status = ?');
        params.push(filters.status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM PrintingHistory ${whereClause}`;
      const countRow = await executeQueryOne<{ total: number }>(countQuery, params);
      const total = countRow?.total || 0;

      // Get records with pagination
      const query = `
        SELECT 
          Id,
          ItemId,
          ItemCode,
          ItemDescription,
          ProductionLineId,
          ProductionLineName,
          Quantity,
          EpcsGenerated,
          PrinterIP,
          PrinterPort,
          PrinterName,
          Status,
          ErrorMessage,
          CreatedAt
        FROM PrintingHistory
        ${whereClause}
        ORDER BY CreatedAt DESC
        ${filters?.limit ? `LIMIT ${filters.limit}` : ''}
        ${filters?.offset ? `OFFSET ${filters.offset}` : ''}
      `;

      const rows = await executeQuery<{
        Id: number;
        ItemId: number;
        ItemCode: string;
        ItemDescription: string | null;
        ProductionLineId: number | null;
        ProductionLineName: string | null;
        Quantity: number;
        EpcsGenerated: number;
        PrinterIP: string | null;
        PrinterPort: number | null;
        PrinterName: string | null;
        Status: string;
        ErrorMessage: string | null;
        CreatedAt: Date;
      }>(query, params);

      const records: PrintingHistoryRecord[] = rows.map((row) => ({
        id: row.Id,
        itemId: row.ItemId,
        itemCode: row.ItemCode,
        itemDescription: row.ItemDescription,
        productionLineId: row.ProductionLineId,
        productionLineName: row.ProductionLineName,
        quantity: row.Quantity,
        epcsGenerated: row.EpcsGenerated,
        printerIP: row.PrinterIP,
        printerPort: row.PrinterPort,
        printerName: row.PrinterName,
        status: row.Status,
        errorMessage: row.ErrorMessage,
        createdAt: row.CreatedAt,
      }));

      return {
        success: true,
        records,
        total,
      };
    } catch (error) {
      console.error('Database findAllPrintingHistory error:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
