/**
 * Production Line Repository
 * Data access layer for Production Lines
 */

import { executeQuery, executeQueryOne } from '../utils/db-helpers';
import { ProductionLine, ProductionLinesResult } from '../types';

export class ProductionLineRepository {
    /**
     * Get all production lines
     */
    async findAll(): Promise<ProductionLinesResult> {
        try {
            const query = `
        SELECT Id, Name
        FROM ProductionLines
        ORDER BY Name
      `;

            const rows = await executeQuery<{ Id: number; Name: string }>(query);

            return {
                success: true,
                productionLines: rows.map((row) => ({
                    id: row.Id,
                    name: row.Name,
                })),
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Find production line by ID
     */
    async findById(id: number): Promise<ProductionLine | null> {
        try {
            const query = `
        SELECT Id, Name
        FROM ProductionLines
        WHERE Id = ?
      `;

            const row = await executeQueryOne<{ Id: number; Name: string }>(query, [id]);

            return row ? { id: row.Id, name: row.Name } : null;
        } catch (error) {
            console.error('Error finding production line by ID:', error);
            return null;
        }
    }

    /**
     * Create a new production line
     */
    async create(name: string): Promise<{ success: boolean; id?: number; error?: string }> {
        try {
            const query = `
        INSERT INTO ProductionLines (Name)
        VALUES (?)
      `;

            const pool = await import('../database/connection').then((m) => m.getPool());
            const [result] = await pool.execute(query, [name]);

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
                    error: 'A production line with this name already exists',
                };
            }
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Update an existing production line
     */
    async update(id: number, name: string): Promise<{ success: boolean; error?: string }> {
        try {
            const query = `
        UPDATE ProductionLines
        SET Name = ?
        WHERE Id = ?
      `;

            const { getPool } = await import('../database/connection');
            const pool = getPool();
            const [result] = await pool.execute(query, [name, id]);

            const updateResult = result as any;
            if (updateResult.affectedRows === 0) {
                return {
                    success: false,
                    error: 'Production line not found',
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
                    error: 'A production line with this name already exists',
                };
            }
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Delete a production line
     */
    async delete(id: number): Promise<{ success: boolean; error?: string }> {
        try {
            // Check if production line is used by any items
            const checkQuery = `
        SELECT COUNT(*) as count
        FROM ItemMaster
        WHERE ProductionLineId = ?
      `;

            const { getPool } = await import('../database/connection');
            const pool = getPool();
            const [checkResult] = await pool.execute(checkQuery, [id]);
            const checkRows = checkResult as any[];

            if (checkRows[0].count > 0) {
                return {
                    success: false,
                    error: 'Cannot delete production line: It is currently assigned to items',
                };
            }

            const deleteQuery = `
        DELETE FROM ProductionLines
        WHERE Id = ?
      `;

            const [result] = await pool.execute(deleteQuery, [id]);
            const deleteResult = result as any;

            if (deleteResult.affectedRows === 0) {
                return {
                    success: false,
                    error: 'Production line not found',
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
