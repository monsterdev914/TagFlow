import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    uploadFile: (filePath: string): Promise<any> => ipcRenderer.invoke('upload-file', filePath),
    lookupItem: (itemCode: string): Promise<any> => ipcRenderer.invoke('lookup-item', itemCode),
    getProductionLines: (): Promise<any> => ipcRenderer.invoke('get-production-lines'),
    createProductionLine: (name: string): Promise<any> => ipcRenderer.invoke('create-production-line', name),
    updateProductionLine: (id: number, name: string): Promise<any> => ipcRenderer.invoke('update-production-line', id, name),
    deleteProductionLine: (id: number): Promise<any> => ipcRenderer.invoke('delete-production-line', id),
    getItems: (filters?: {
        code?: string;
        description?: string;
        productionLineIds?: number[];
    }): Promise<any> => ipcRenderer.invoke('get-items', filters),
    createItem: (data: {
        code: string;
        description1?: string;
        description2?: string;
        unitOfMeasure?: string;
        identifier?: string;
        productionLineId?: number | null;
    }): Promise<any> => ipcRenderer.invoke('create-item', data),
    updateItem: (id: number, data: {
        code?: string;
        description1?: string;
        description2?: string;
        unitOfMeasure?: string;
        identifier?: string;
        productionLineId?: number | null;
    }): Promise<any> => ipcRenderer.invoke('update-item', id, data),
    deleteItem: (id: number): Promise<any> => ipcRenderer.invoke('delete-item', id),
    generateAndPrint: (params: {
        items: Array<{
            itemId: number;
            quantity: number;
        }>;
    }): Promise<any> => ipcRenderer.invoke('generate-and-print', params),
    getPrintingHistory: (filters?: {
        itemId?: number;
        productionLineId?: number;
        startDate?: string;
        endDate?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<any> => ipcRenderer.invoke('get-printing-history', filters),
    checkDbStatus: (): Promise<{
        connected: boolean;
        mode: 'database';
        error?: string;
        server?: string;
        database?: string;
    }> => ipcRenderer.invoke('check-db-status'),
    login: (username: string, password: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('login', username, password),
    logout: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('logout'),
    updateUsername: (currentUsername: string, newUsername: string, password: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('update-username', currentUsername, newUsername, password),
    updatePassword: (username: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('update-password', username, currentPassword, newPassword),
    closeApp: (): Promise<void> => ipcRenderer.invoke('close-app'),
});