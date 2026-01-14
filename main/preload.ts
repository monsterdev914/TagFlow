import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    uploadFile: (filePath: string): Promise<any> => ipcRenderer.invoke('upload-file', filePath)
});