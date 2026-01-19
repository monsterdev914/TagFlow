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
  createProductionLine: (name: string) => Promise<{
    success: boolean;
    id?: number;
    error?: string;
  }>;
  updateProductionLine: (id: number, name: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  deleteProductionLine: (id: number) => Promise<{
    success: boolean;
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
  createItem: (data: {
    code: string;
    description1?: string;
    description2?: string;
    unitOfMeasure?: string;
    identifier?: string;
    productionLineId?: number | null;
  }) => Promise<{
    success: boolean;
    id?: number;
    error?: string;
  }>;
  updateItem: (id: number, data: {
    code?: string;
    description1?: string;
    description2?: string;
    unitOfMeasure?: string;
    identifier?: string;
    productionLineId?: number | null;
  }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  deleteItem: (id: number) => Promise<{
    success: boolean;
    error?: string;
  }>;
  generateAndPrint: (params: {
    items: Array<{
      itemId: number;
      quantity: number;
    }>;
  }) => Promise<{
    success: boolean;
    epcsGenerated?: number;
    message?: string;
    error?: string;
  }>;
  getPrintingHistory: (filters?: {
    itemId?: number;
    productionLineId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => Promise<{
    success: boolean;
    records?: Array<{
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
    }>;
    total?: number;
    error?: string;
  }>;
  checkDbStatus: () => Promise<{
    connected: boolean;
    mode: 'database';
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
  updateUsername: (currentUsername: string, newUsername: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  updatePassword: (username: string, currentPassword: string, newPassword: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  closeApp: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
