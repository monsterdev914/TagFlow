/**
 * Item Service
 * Business logic for items
 */

import { ItemRepository, ItemFilters } from '../repositories/item.repository';
import { ItemsResult, ItemResult } from '../types';

export interface CreateItemData {
  code: string;
  description1?: string;
  description2?: string;
  unitOfMeasure?: string;
  identifier?: string;
  productionLineId?: number | null;
}

export interface UpdateItemData {
  code?: string;
  description1?: string;
  description2?: string;
  unitOfMeasure?: string;
  identifier?: string;
  productionLineId?: number | null;
}

export interface CreateItemResult {
  success: boolean;
  id?: number;
  error?: string;
}

export interface UpdateItemResult {
  success: boolean;
  error?: string;
}

export interface DeleteItemResult {
  success: boolean;
  error?: string;
}

export class ItemService {
  private itemRepository: ItemRepository;

  constructor(itemRepository: ItemRepository) {
    this.itemRepository = itemRepository;
  }

  /**
   * Get all items with optional filters
   */
  async getItems(filters?: ItemFilters): Promise<ItemsResult> {
    return await this.itemRepository.findAll(filters);
  }

  /**
   * Get item by ID
   */
  async getItemById(id: number): Promise<ItemResult> {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'Invalid item ID',
      };
    }

    return await this.itemRepository.findById(id);
  }

  /**
   * Create a new item
   */
  async createItem(data: CreateItemData): Promise<CreateItemResult> {
    if (!data.code || !data.code.trim()) {
      return {
        success: false,
        error: 'Item code is required',
      };
    }

    const trimmedCode = data.code.trim();
    if (trimmedCode.length < 1 || trimmedCode.length > 50) {
      return {
        success: false,
        error: 'Item code must be between 1 and 50 characters',
      };
    }

    return await this.itemRepository.create({
      code: trimmedCode,
      description1: data.description1?.trim() || undefined,
      description2: data.description2?.trim() || undefined,
      unitOfMeasure: data.unitOfMeasure?.trim() || undefined,
      identifier: data.identifier?.trim() || trimmedCode,
      productionLineId: data.productionLineId || null,
    });
  }

  /**
   * Update an existing item
   */
  async updateItem(id: number, data: UpdateItemData): Promise<UpdateItemResult> {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'Invalid item ID',
      };
    }

    if (data.code !== undefined) {
      const trimmedCode = data.code.trim();
      if (!trimmedCode || trimmedCode.length < 1 || trimmedCode.length > 50) {
        return {
          success: false,
          error: 'Item code must be between 1 and 50 characters',
        };
      }
      data.code = trimmedCode;
    }

    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description1 !== undefined) updateData.description1 = data.description1?.trim() || null;
    if (data.description2 !== undefined) updateData.description2 = data.description2?.trim() || null;
    if (data.unitOfMeasure !== undefined) updateData.unitOfMeasure = data.unitOfMeasure?.trim() || null;
    if (data.identifier !== undefined) updateData.identifier = data.identifier?.trim() || null;
    if (data.productionLineId !== undefined) updateData.productionLineId = data.productionLineId || null;

    return await this.itemRepository.update(id, updateData);
  }

  /**
   * Delete an item
   */
  async deleteItem(id: number): Promise<DeleteItemResult> {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'Invalid item ID',
      };
    }

    return await this.itemRepository.delete(id);
  }
}
