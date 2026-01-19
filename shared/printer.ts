/**
 * Printer Communication Utility
 * Generates ZPL commands for RFID label printing and encoding
 */

import { GeneratedEPC } from './epcGenerator';

export interface PrinterConfig {
  productionLine: string;
  printerIP?: string;
  printerPort?: number;
  printerName?: string; // Windows printer name
}

export interface PrintJob {
  epcs: GeneratedEPC[];
  itemNumber: string;
  itemDescription: string;
  productionLine: string;
}

/**
 * Generate ZPL commands for RFID encoding and label printing
 * ZPL format for RFID printers (e.g., Zebra printers)
 */
export function generateZPL(printJob: PrintJob): string {
  const { epcs, itemNumber, itemDescription, productionLine } = printJob;

  // Label dimensions: 60mm x 40mm (480 x 320 dots at 203 DPI)
  const labelWidth = 480; // 60mm at 203 DPI
  const labelHeight = 320; // 40mm at 203 DPI

  let zpl = '';

  // Generate ZPL for each EPC (each gets its own complete label with header)
  epcs.forEach((epc, index) => {
    // Start of label format block
    zpl += '^XA\n';

    const labelY = 20; // Start position for each label

    // Header section for each label (matching exact ZPL format)
    // Production Line
    zpl += `^FO20,${labelY}^A0N,25,25^FDProduction Line ${productionLine}^FS\n`;

    // Logo (positioned on top right)
    zpl += `^FO380,${labelY + 20}^XGLOGO.GRF,1,1^FS\n`;

    // Item number
    zpl += `^FO20,${labelY + 40}^A0N,20,20^FDItem: ${itemNumber}^FS\n`;

    // Item description (full text, no truncation)
    zpl += `^FO20,${labelY + 70}^A0N,20,20^FD${itemDescription}^FS\n`;

    // Separator line (first separator)
    zpl += `^FO20,${labelY + 100}^GB440,3,3^FS\n`;

    // Label-specific data (below separator)
    const labelDataY = labelY + 110;

    // Label X/Y (matching LabelPreview)
    zpl += `^FO20,${labelDataY}^A0N,25,25^FDLabel ${index + 1}/${epcs.length}^FS\n`;

    // Serial number (matching LabelPreview - no repeated Item field)
    zpl += `^FO20,${labelDataY + 30}^A0N,20,20^FDSerial: ${epc.serialNumber}^FS\n`;

    // EPC hex (matching LabelPreview)
    zpl += `^FO20,${labelDataY + 55}^A0N,18,18^FD${epc.epcHex}^FS\n`;

    // RFID encoding command (format: ^RFE,H,A^FD...^FS)
    zpl += `^RF${index === 0 ? 'E' : 'N'},H,A^FD${epc.epcHex}^FS\n`;

    // Second separator line (between EPC and barcode)
    zpl += `^FO20,${labelDataY + 80}^GB440,3,3^FS\n`;

    // Barcode (positioned at X=215, Y=230)
    zpl += `^FO215,${labelDataY + 100}^BY2^BCN,60,Y,N,N^FD${itemNumber}-${epc.serialNumber}^FS\n`;

    // End of label format block
    zpl += '^XZ\n';
  });

  return zpl;
}

/**
 * Send print job to printer
 */
export async function sendToPrinter(
  zpl: string,
  config: PrinterConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Option 1: Network printer (TCP/IP)
    if (config.printerIP && config.printerPort) {
      const net = require('net');

      return new Promise((resolve) => {
        const client = new net.Socket();
        const timeout = 5000; // 5 second timeout

        client.setTimeout(timeout);

        client.on('connect', () => {
          client.write(zpl, 'utf8', () => {
            client.end();
            resolve({ success: true });
          });
        });

        client.on('timeout', () => {
          client.destroy();
          resolve({
            success: false,
            error: `Connection timeout to printer ${config.printerIP}:${config.printerPort}`,
          });
        });

        client.on('error', (error: Error) => {
          resolve({
            success: false,
            error: `Printer connection error: ${error.message}`,
          });
        });

        client.connect(config.printerPort, config.printerIP);
      });
    }

    // Option 2: Windows printer (using node-printer or similar)
    if (config.printerName) {
      // For Windows, you may need to install 'node-printer' package
      // This is a placeholder implementation
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        // Create temporary file
        const tempFile = path.join(os.tmpdir(), `print_${Date.now()}.zpl`);
        fs.writeFileSync(tempFile, zpl, 'utf8');

        try {
          // Use Windows copy command to send to printer
          // This is a basic implementation - may need adjustment
          await execAsync(`copy /B "${tempFile}" "\\\\${config.printerName}"`);
          fs.unlinkSync(tempFile);
          return { success: true };
        } catch (error) {
          fs.unlinkSync(tempFile);
          return {
            success: false,
            error: `Failed to send to Windows printer: ${(error as Error).message}`,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: `Windows printer error: ${(error as Error).message}`,
        };
      }
    }

    // Option 3: File output (for testing/fallback)
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // Use temp directory instead of process.cwd() for better compatibility
    const outputDir = os.tmpdir();
    const sanitizedProductionLine = config.productionLine.replace(/[^a-zA-Z0-9_-]/g, '_');
    const outputPath = path.join(
      outputDir,
      `print_job_line_${sanitizedProductionLine}_${Date.now()}.zpl`
    );

    try {
      fs.writeFileSync(outputPath, zpl, 'utf8');
      return {
        success: true,
        error: `Print job saved to file: ${outputPath} (Configure printer IP/port to send directly)`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save print job to file: ${(error as Error).message}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
