/**
 * Printing Service
 * Business logic for label printing and EPC generation
 */

import { ItemRepository } from '../repositories/item.repository';
import { PrintingHistoryRepository, CreatePrintingHistoryData } from '../repositories/printing-history.repository';
import { GeneratedEPC, generateEPCs } from '../../shared/epcGenerator';
import { generateZPL, sendToPrinter, type PrintJob } from '../../shared/printer';
import { PrintParams, PrintResult } from '../types';
import { ValidationError } from '../utils/errors';

export class PrintingService {
  private itemRepository: ItemRepository;
  private printingHistoryRepository: PrintingHistoryRepository;

  constructor(itemRepository: ItemRepository, printingHistoryRepository: PrintingHistoryRepository) {
    this.itemRepository = itemRepository;
    this.printingHistoryRepository = printingHistoryRepository;
  }

  /**
   * Generate EPCs and send print job to printer
   */
  async generateAndPrint(params: PrintParams): Promise<PrintResult> {
    const { items } = params;

    if (!items || items.length === 0) {
      return {
        success: false,
        error: 'No items provided',
      };
    }

    // Step 1: Validate all items and collect their data
    const itemData: Array<{
      itemId: number;
      item: {
        code: string;
        description: string;
        productionLineId: number | null;
        productionLineName: string;
      };
      quantity: number;
    }> = [];

    for (const { itemId, quantity } of items) {
      const itemResult = await this.itemRepository.findById(itemId);
      if (!itemResult.success || !itemResult.item) {
        return {
          success: false,
          error: itemResult.error || `Item ${itemId} not found`,
        };
      }

      itemData.push({
        itemId,
        item: {
          code: itemResult.item.code,
          description: itemResult.item.description,
          productionLineId: itemResult.item.productionLineId,
          productionLineName: itemResult.item.productionLineName,
        },
        quantity,
      });
    }

    // Step 2: Generate EPCs for all items and combine into one ZPL
    let combinedZPL = '';
    let totalEPCs = 0;
    const allEpcs: Array<{ epc: GeneratedEPC; itemCode: string; productionLine: string }> = [];

    for (const { item, quantity } of itemData) {
      // Generate EPCs for this item
      const itemEpcs = generateEPCs({
        itemNumber: item.code,
        quantity,
        companyPrefix: process.env.COMPANY_PREFIX || '000000000000',
        serialStart: 1,
      });

      totalEPCs += itemEpcs.length;

      // Store EPCs with their associated item info for API calls
      itemEpcs.forEach(epc => {
        allEpcs.push({
          epc,
          itemCode: item.code,
          productionLine: item.productionLineName,
        });
      });

      // Generate ZPL for this item's labels and append to combined ZPL
      const printJob: PrintJob = {
        epcs: itemEpcs,
        itemNumber: item.code,
        itemDescription: item.description,
        productionLine: item.productionLineName,
      };

      const itemZPL = generateZPL(printJob);
      combinedZPL += itemZPL;
    }

    // Step 3: Send combined ZPL to printer
    // Use the first item's production line for printer configuration
    const firstProductionLine = itemData[0].item.productionLineName;
    const productionLineId = itemData[0].item.productionLineId || 1;

    const printerConfig = {
      productionLine: firstProductionLine,
      printerIP: process.env[`PRINTER_IP_LINE_${productionLineId}`],
      printerPort: parseInt(
        process.env[`PRINTER_PORT_LINE_${productionLineId}`] || '9100'
      ),
      printerName: process.env[`PRINTER_NAME_LINE_${productionLineId}`],
    };

    const printResult = await sendToPrinter(combinedZPL, printerConfig);

    if (!printResult.success) {
      // Record failed print attempt
      for (const { itemId, item, quantity } of itemData) {
        await this.printingHistoryRepository.create({
          itemId,
          itemCode: item.code,
          itemDescription: item.description,
          productionLineId: item.productionLineId,
          productionLineName: item.productionLineName,
          quantity,
          epcsGenerated: 0,
          printerIP: printerConfig.printerIP || null,
          printerPort: printerConfig.printerPort || null,
          printerName: printerConfig.printerName || null,
          status: 'failed',
          errorMessage: printResult.error || 'Failed to send to printer',
        });
      }
      return {
        success: false,
        error: printResult.error || 'Failed to send to printer',
      };
    }

    // Send data to API for each EPC
    const apiErrors: string[] = [];
    for (const { epc, itemCode, productionLine } of allEpcs) {
      const apiResult = await this.sendApi(epc.epcHex, itemCode, '', productionLine);
      if (!apiResult.success) {
        apiErrors.push(`EPC ${epc.epcHex}: ${apiResult.error || 'Failed to send data to API'}`);
        console.error(`Failed to send EPC ${epc.epcHex} to API:`, apiResult.error);
      }
    }

    // If any API calls failed, record as partial success
    if (apiErrors.length > 0) {
      for (const { itemId, item, quantity } of itemData) {
        await this.printingHistoryRepository.create({
          itemId,
          itemCode: item.code,
          itemDescription: item.description,
          productionLineId: item.productionLineId,
          productionLineName: item.productionLineName,
          quantity,
          epcsGenerated: totalEPCs,
          printerIP: printerConfig.printerIP || null,
          printerPort: printerConfig.printerPort || null,
          printerName: printerConfig.printerName || null,
          status: 'partial',
          errorMessage: `${apiErrors.length} of ${allEpcs.length} EPCs failed to send: ${apiErrors.slice(0, 3).join('; ')}${apiErrors.length > 3 ? '...' : ''}`,
        });
      }
      return {
        success: false,
        error: `Print succeeded but ${apiErrors.length} of ${allEpcs.length} EPCs failed to send to API`,
      };
    }


    // Record successful print history for each item
    for (const { itemId, item, quantity } of itemData) {
      // Calculate EPCs for this specific item
      const itemEpcs = generateEPCs({
        itemNumber: item.code,
        quantity,
        companyPrefix: process.env.COMPANY_PREFIX || '000000000000',
        serialStart: 1,
      });

      await this.printingHistoryRepository.create({
        itemId,
        itemCode: item.code,
        itemDescription: item.description,
        productionLineId: item.productionLineId,
        productionLineName: item.productionLineName,
        quantity,
        epcsGenerated: itemEpcs.length,
        printerIP: printerConfig.printerIP || null,
        printerPort: printerConfig.printerPort || null,
        printerName: printerConfig.printerName || null,
        status: 'success',
        errorMessage: null,
      });
    }

    return {
      success: true,
      epcsGenerated: totalEPCs,
      message: printResult.error || `Print job sent successfully (${items.length} items, ${totalEPCs} labels)`,
    };
  }

  // Send Api
  async sendApi(epc: string, materialNumber: string, batchNumber = '', productionLine: string) {
    const DOMAIN = "https://mtc31a3-api-01.azurewebsites.net";
    const TOKEN = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoicHJpbnRlcjAxQG1ha2FtYXQuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVXNlciIsImV4cCI6MTgwMDIxNDk1NX0.zNvh6dt8HWMLBSGz4N3nsTxtj2icAjZBWMVztpspbUg2c9vnO4iy7YnSCdOw_fr_FLOT4Xy654bhAzAlacAwRg"
    const url = `${DOMAIN}/api/AssetInformation/PrinterUpsert`;
    const timestamp = new Date().toISOString();
    const data = {
      EPC: epc,
      MaterialNumber: materialNumber,
      BatchNumber: batchNumber,
      ProductionLine: productionLine,
      Timestamp: timestamp
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to send data to API: ${response.status}`
      };
    }
    return {
      success: true,
      message: `Data sent successfully to API`
    };
  }
}
