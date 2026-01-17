import React, { useState, useEffect } from 'react';
import { Database, AlertCircle } from 'lucide-react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
    const [dbStatus, setDbStatus] = useState<{
        connected: boolean;
        mode: 'database' | 'mock';
        error?: string;
        server?: string;
        database?: string;
    } | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            if (window.electronAPI && typeof window.electronAPI.checkDbStatus === 'function') {
                try {
                    const status = await window.electronAPI.checkDbStatus();
                    setDbStatus(status);
                } catch (error) {
                    setDbStatus({
                        connected: false,
                        mode: 'database',
                        error: 'Failed to check status',
                    });
                }
            }
        };

        checkStatus();
        // Check status every 30 seconds
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <header
                className="bg-gray-800 text-white p-4"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">RFID Label Production System</h1>
                    {dbStatus && (
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
                            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                        >
                            {dbStatus.connected ? (
                                <>
                                    <Database className="h-4 w-4 text-green-400" />
                                    <span className="text-green-400">
                                        {dbStatus.mode === 'mock' ? 'Mock Mode' : `DB: ${dbStatus.server || 'Connected'}`}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                    <span className="text-red-400">DB Disconnected</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </header>
            <main className="flex-1 p-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;