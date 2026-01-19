/**
 * EPC Generation Utility
 * Generates SGTIN-96 format EPCs for RFID encoding
 */

export interface EPCGenerationParams {
  itemNumber: string;
  quantity: number;
  companyPrefix?: string; // Optional: if not provided, will be derived from itemNumber
  serialStart?: number; // Optional: starting serial number (default: 1)
}

export interface GeneratedEPC {
  epc: string; // Binary EPC (96 bits as hex string)
  epcHex: string; // EPC in hexadecimal format
  epcUri: string; // EPC in URI format (urn:epc:id:sgtin:...)
  serialNumber: number;
  itemNumber: string;
}

/**
 * SGTIN-96 EPC Structure:
 * - Header (8 bits): 0011 0000 (0x30) for SGTIN-96
 * - Filter (3 bits): 0-7 (typically 1 for retail item)
 * - Partition (3 bits): Indicates Company Prefix and Item Reference lengths
 * - Company Prefix (20-40 bits): Based on partition
 * - Item Reference (4-24 bits): Based on partition
 * - Serial Number (38 bits): Unique serial number
 */

const SGTIN96_HEADER = 0x30; // 0011 0000
const DEFAULT_FILTER = 1; // Retail item
const DEFAULT_PARTITION = 6; // Company Prefix: 12 digits, Item Reference: 1 digit

/**
 * Convert a number to a binary string with specified length
 */
function toBinaryString(value: number, length: number): string {
  return value.toString(2).padStart(length, '0');
}

/**
 * Convert binary string to hex string
 */
function binaryToHex(binary: string): string {
  // Pad to multiple of 4
  const padded = binary.padEnd(Math.ceil(binary.length / 4) * 4, '0');
  let hex = '';
  for (let i = 0; i < padded.length; i += 4) {
    const nibble = padded.substr(i, 4);
    hex += parseInt(nibble, 2).toString(16).toUpperCase();
  }
  return hex;
}

/**
 * Generate a unique EPC for an item
 */
export function generateEPC(
  itemNumber: string,
  serialNumber: number,
  companyPrefix: string = '000000000000' // 12-digit default
): GeneratedEPC {
  // For SGTIN-96 with partition 6:
  // - Company Prefix: 12 digits (40 bits)
  // - Item Reference: 1 digit (4 bits)
  // - Serial Number: 38 bits

  // Extract item reference (last digit of item number or use item number)
  const itemRef = itemNumber.length > 0 ? parseInt(itemNumber.slice(-1)) || 1 : 1;

  // Convert company prefix to number (assuming it's numeric)
  const companyPrefixNum = parseInt(companyPrefix.replace(/\D/g, '').padStart(12, '0').slice(0, 12)) || 0;

  // Build binary EPC
  let binary = '';

  // Header (8 bits)
  binary += toBinaryString(SGTIN96_HEADER, 8);

  // Filter (3 bits)
  binary += toBinaryString(DEFAULT_FILTER, 3);

  // Partition (3 bits)
  binary += toBinaryString(DEFAULT_PARTITION, 3);

  // Company Prefix (40 bits for partition 6)
  binary += toBinaryString(companyPrefixNum, 40);

  // Item Reference (4 bits for partition 6)
  binary += toBinaryString(itemRef, 4);

  // Serial Number (38 bits)
  binary += toBinaryString(serialNumber, 38);

  // Convert to hex
  const epcHex = binaryToHex(binary);

  // Generate EPC URI format: urn:epc:id:sgtin:CompanyPrefix.ItemRef.SerialNumber
  const epcUri = `urn:epc:id:sgtin:${companyPrefix}.${itemRef.toString().padStart(1, '0')}.${serialNumber}`;

  return {
    epc: binary,
    epcHex: epcHex.padStart(24, '0'), // 96 bits = 24 hex characters
    epcUri,
    serialNumber,
    itemNumber,
  };
}

/**
 * Generate multiple unique EPCs for a given item and quantity
 */
export function generateEPCs(params: EPCGenerationParams): GeneratedEPC[] {
  const {
    itemNumber,
    quantity,
    companyPrefix = '000000000000',
    serialStart = 1,
  } = params;

  const epcs: GeneratedEPC[] = [];

  for (let i = 0; i < quantity; i++) {
    const serialNumber = serialStart + i;
    const epc = generateEPC(itemNumber, serialNumber, companyPrefix);
    epcs.push(epc);
  }

  return epcs;
}
