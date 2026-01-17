import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    uploadFile: (filePath: string): Promise<any> => ipcRenderer.invoke('upload-file', filePath),
    lookupItem: (itemCode: string): Promise<any> => ipcRenderer.invoke('lookup-item', itemCode),
    getProductionLines: (): Promise<any> => ipcRenderer.invoke('get-production-lines'),
    getItems: (filters?: {
        code?: string;
        description?: string;
        productionLineIds?: number[];
    }): Promise<any> => ipcRenderer.invoke('get-items', filters),
    generateAndPrint: (params: {
        productionLine: number;
        itemId: number;
        quantity: number;
    }): Promise<any> => ipcRenderer.invoke('generate-and-print', params),
    checkDbStatus: (): Promise<{
        connected: boolean;
        mode: 'database' | 'mock';
        error?: string;
        server?: string;
        database?: string;
    }> => ipcRenderer.invoke('check-db-status'),
    login: (username: string, password: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('login', username, password),
    logout: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('logout'),
});