/**
 * Printing History Service
 * Business logic for printing history management
 */

import { PrintingHistoryRepository, PrintingHistoryFilters, PrintingHistoryResult } from '../repositories/printing-history.repository';

export class PrintingHistoryService {
  private printingHistoryRepository: PrintingHistoryRepository;

  constructor(printingHistoryRepository: PrintingHistoryRepository) {
    this.printingHistoryRepository = printingHistoryRepository;
  }

  /**
   * Get printing history with optional filters
   */
  async getPrintingHistory(filters?: PrintingHistoryFilters): Promise<PrintingHistoryResult> {
    return await this.printingHistoryRepository.findAll(filters);
  }
}
