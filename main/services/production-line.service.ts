/**
 * Production Line Service
 * Business logic for production lines
 */

import { ProductionLineRepository } from '../repositories/production-line.repository';
import { ProductionLinesResult, ProductionLine } from '../types';
import { ValidationError } from '../utils/errors';

export interface CreateProductionLineResult {
  success: boolean;
  id?: number;
  error?: string;
}

export interface UpdateProductionLineResult {
  success: boolean;
  error?: string;
}

export interface DeleteProductionLineResult {
  success: boolean;
  error?: string;
}

export class ProductionLineService {
  private productionLineRepository: ProductionLineRepository;

  constructor(productionLineRepository: ProductionLineRepository) {
    this.productionLineRepository = productionLineRepository;
  }

  /**
   * Get all production lines
   */
  async getProductionLines(): Promise<ProductionLinesResult> {
    return await this.productionLineRepository.findAll();
  }

  /**
   * Get production line by ID
   */
  async getProductionLineById(id: number): Promise<ProductionLine | null> {
    if (!id || id <= 0) {
      return null;
    }
    return await this.productionLineRepository.findById(id);
  }

  /**
   * Create a new production line
   */
  async createProductionLine(name: string): Promise<CreateProductionLineResult> {
    if (!name || !name.trim()) {
      return {
        success: false,
        error: 'Production line name is required',
      };
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return {
        success: false,
        error: 'Production line name must be between 1 and 100 characters',
      };
    }

    return await this.productionLineRepository.create(trimmedName);
  }

  /**
   * Update an existing production line
   */
  async updateProductionLine(id: number, name: string): Promise<UpdateProductionLineResult> {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'Invalid production line ID',
      };
    }

    if (!name || !name.trim()) {
      return {
        success: false,
        error: 'Production line name is required',
      };
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return {
        success: false,
        error: 'Production line name must be between 1 and 100 characters',
      };
    }

    return await this.productionLineRepository.update(id, trimmedName);
  }

  /**
   * Delete a production line
   */
  async deleteProductionLine(id: number): Promise<DeleteProductionLineResult> {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'Invalid production line ID',
      };
    }

    return await this.productionLineRepository.delete(id);
  }
}
