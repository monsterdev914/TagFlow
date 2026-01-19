/**
 * Item Repository
 * Data access layer for Items (ItemMaster)
 */

import { executeQuery, executeQueryOne } from '../utils/db-helpers';
import { Item, ItemsResult, ItemResult } from '../types';

export interface ItemFilters {
  code?: string;
  description?: string;
  productionLineIds?: number[];
}

export class ItemRepository {
  /**
   * Find all items with optional filters
   */
  async findAll(filters?: ItemFilters): Promise<ItemsResult> {
    try {
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

      const rows = await executeQuery<any>(query, params);

      const items: Item[] = rows.map((row) => ({
        id: row.Id,
        code: row.Code,
        description: row.Description1 || row.Description2 || '',
        description1: row.Description1 || '',
        description2: row.Description2 || '',
        unitOfMeasure: row.UnitOfMeasure || '',
        identifier: row.Identifier || row.Code,
        productionLine: row.ProductionLineId
          ? { id: row.ProductionLineId, name: row.ProductionLineName || '' }
          : null,
        productionLineId: row.ProductionLineId || null,
        productionLineName: row.ProductionLineName || '',
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
   * Find item by ID
   */
  async findById(id: number): Promise<ItemResult> {
    try {
      const query = `
        SELECT 
          im.Id,
          im.Code,
          im.Description1,
          im.Description2,
          im.UnitOfMeasure,
          im.Identifier,
          pl.Id AS ProductionLineId,
          pl.Name AS ProductionLineName
        FROM ItemMaster im
        LEFT JOIN ProductionLines pl ON im.ProductionLineId = pl.Id
        WHERE im.Id = ?
      `;

      const row = await executeQueryOne<any>(query, [id]);

      if (!row) {
        return {
          success: false,
          error: 'Item not found in database',
        };
      }

      const item: Item = {
        id: row.Id,
        code: row.Code,
        description: row.Description1 || row.Description2 || '',
        description1: row.Description1 || '',
        description2: row.Description2 || '',
        unitOfMeasure: row.UnitOfMeasure || '',
        identifier: row.Identifier || row.Code,
        productionLine: row.ProductionLineId
          ? { id: row.ProductionLineId, name: row.ProductionLineName || '' }
          : null,
        productionLineId: row.ProductionLineId || null,
        productionLineName: row.ProductionLineName || '',
      };

      return {
        success: true,
        item,
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
   * Create a new item
   */
  async create(data: {
    code: string;
    description1?: string;
    description2?: string;
    unitOfMeasure?: string;
    identifier?: string;
    productionLineId?: number | null;
  }): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const query = `
        INSERT INTO ItemMaster (Code, Description1, Description2, UnitOfMeasure, Identifier, ProductionLineId)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const { getPool } = await import('../database/connection');
      const pool = getPool();
      const [result] = await pool.execute(query, [
        data.code,
        data.description1 || null,
        data.description2 || null,
        data.unitOfMeasure || null,
        data.identifier || data.code,
        data.productionLineId || null,
      ]);

      const insertResult = result as any;
      return {
        success: true,
        id: insertResult.insertId,
      };
    } catch (error) {
      const mysqlError = error as any;
      if (mysqlError.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          error: 'An item with this code already exists',
        };
      }
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Update an existing item
   */
  async update(
    id: number,
    data: {
      code?: string;
      description1?: string;
      description2?: string;
      unitOfMeasure?: string;
      identifier?: string;
      productionLineId?: number | null;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.code !== undefined) {
        updates.push('Code = ?');
        values.push(data.code);
      }
      if (data.description1 !== undefined) {
        updates.push('Description1 = ?');
        values.push(data.description1 || null);
      }
      if (data.description2 !== undefined) {
        updates.push('Description2 = ?');
        values.push(data.description2 || null);
      }
      if (data.unitOfMeasure !== undefined) {
        updates.push('UnitOfMeasure = ?');
        values.push(data.unitOfMeasure || null);
      }
      if (data.identifier !== undefined) {
        updates.push('Identifier = ?');
        values.push(data.identifier || null);
      }
      if (data.productionLineId !== undefined) {
        updates.push('ProductionLineId = ?');
        values.push(data.productionLineId || null);
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: 'No fields to update',
        };
      }

      values.push(id);

      const query = `
        UPDATE ItemMaster
        SET ${updates.join(', ')}
        WHERE Id = ?
      `;

      const { getPool } = await import('../database/connection');
      const pool = getPool();
      const [result] = await pool.execute(query, values);

      const updateResult = result as any;
      if (updateResult.affectedRows === 0) {
        return {
          success: false,
          error: 'Item not found',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      const mysqlError = error as any;
      if (mysqlError.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          error: 'An item with this code already exists',
        };
      }
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Delete an item
   */
  async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const query = `
        DELETE FROM ItemMaster
        WHERE Id = ?
      `;

      const { getPool } = await import('../database/connection');
      const pool = getPool();
      const [result] = await pool.execute(query, [id]);

      const deleteResult = result as any;
      if (deleteResult.affectedRows === 0) {
        return {
          success: false,
          error: 'Item not found',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
