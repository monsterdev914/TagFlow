export interface ElectronAPI {
  uploadFile: (filePath: string) => Promise<any>;
  lookupItem: (itemCode: string) => Promise<{
    success: boolean;
    item?: { code: string; description: string; description1?: string; description2?: string;[key: string]: any };
    error?: string;
  }>;
  getProductionLines: () => Promise<{
    success: boolean;
    productionLines?: Array<{ id: number; name: string }>;
    error?: string;
  }>;
  getItems: (filters?: {
    code?: string;
    description?: string;
    productionLineIds?: number[];
  }) => Promise<{
    success: boolean;
    items?: Array<{
      id: number;
      code: string;
      description1: string;
      description2: string;
      unitOfMeasure: string;
      identifier: string;
      productionLine: { id: number; name: string } | null;
    }>;
    error?: string;
  }>;
  generateAndPrint: (params: {
    productionLine: number;
    itemId: number;
    quantity: number;
  }) => Promise<{
    success: boolean;
    epcsGenerated?: number;
    message?: string;
    error?: string;
  }>;
  checkDbStatus: () => Promise<{
    connected: boolean;
    mode: 'database' | 'mock';
    error?: string;
    server?: string;
    database?: string;
  }>;
  login: (username: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<{
    success: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
