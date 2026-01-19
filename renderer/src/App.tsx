import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Main from "./pages/Main";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import { Toaster } from "./components/ui/toaster";
import ProductionLines from "./pages/ProductionLines";
import Items from "./pages/Items";
import SplashScreen from "./components/SplashScreen";
import Setting from "./pages/Setting";
import PrintHistory from "./pages/PrintHistory";

function App() {
    const [isInitializing, setIsInitializing] = useState(true);
    const [initMessage, setInitMessage] = useState('Loading configuration...');

    useEffect(() => {
        // Check if app is ready
        const checkReady = async () => {
            try {
                // Wait a bit for the window to be ready
                await new Promise(resolve => setTimeout(resolve, 500));

                // Check database status to ensure backend is ready
                if (window.electronAPI && typeof window.electronAPI.checkDbStatus === 'function') {
                    setInitMessage('Connecting to database...');
                    await window.electronAPI.checkDbStatus();
                }

                setInitMessage('Finalizing setup...');
                await new Promise(resolve => setTimeout(resolve, 300));

                setIsInitializing(false);
            } catch (error) {
                console.error('Initialization error:', error);
                // Still hide splash screen after a delay
                setTimeout(() => setIsInitializing(false), 1000);
            }
        };

        checkReady();
    }, []);

    if (isInitializing) {
        return <SplashScreen message={initMessage} />;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<MainLayout />}>
                    <Route path="/main" element={<Main />} />
                    <Route path="/production-lines" element={<ProductionLines />} />
                    <Route path="/items" element={<Items />} />
                    <Route path="/setting" element={<Setting />} />
                    <Route path="/print-history" element={<PrintHistory />} />
                </Route>
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster />
        </BrowserRouter>
    );
}

export default App;
