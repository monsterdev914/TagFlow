import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Database, AlertCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';

const MainLayout = () => {
    const [dbStatus, setDbStatus] = useState<{
        connected: boolean;
        mode: 'database';
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

    const handleLogout = () => {
        if (window.electronAPI && typeof window.electronAPI.closeApp === 'function') {
            window.electronAPI.closeApp();
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="flex flex-col h-screen relative w-full overflow-hidden">
            <header
                className="bg-gray-800 text-white p-4 sticky top-0 z-10 w-full flex-shrink-0"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                        <img src="./logo.png" alt="Logo" className="h-12 w-12" />
                        <h1 className="text-2xl font-bold">RFID Label Production System</h1>
                    </div>
                    <div className="flex items-center gap-5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                        <Link to="/main" className="text-white hover:text-gray-300">Home</Link>
                        <Link to="/production-lines" className="text-white hover:text-gray-300">Production Lines</Link>
                        <Link to="/items" className="text-white hover:text-gray-300">Items</Link>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            className="bg-transparent border-white/20 text-white hover:bg-white/10"
                        >
                            <LogOut className="h-4 w-4" /> Logout
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 p-4 overflow-y-auto" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <Outlet />
            </main>

            <footer className="bg-gray-800 flex flex-row items-center justify-between text-white p-4 sticky bottom-0 z-10 w-full flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
                <div className="flex items-center justify-between">
                    <span className="text-sm">© 2026 RFID Label Production System. All rights reserved.</span>
                </div>
                {dbStatus && (
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm"
                        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                        {dbStatus.connected ? (
                            <>
                                <Database className="h-4 w-4 text-green-400" />
                                <span className="text-green-400">
                                    `DB: ${dbStatus.server || 'Connected'}`
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
            </footer>
        </div>
    );
};

export default MainLayout;