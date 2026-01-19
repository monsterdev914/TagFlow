/**
 * Splash Screen Component
 * Shows while the application is initializing
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface SplashScreenProps {
    message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ message = 'Loading...' }) => {
    return (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-6">
                {/* Logo */}
                <div className="flex items-center justify-center">
                    <img
                        src="./logo.png"
                        alt="Logo"
                        className="h-24 w-24 animate-pulse"
                    />
                </div>

                {/* App Name */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        RFID Label Production System
                    </h1>
                    <p className="text-gray-400 text-lg">
                        {message}
                    </p>
                </div>

                {/* Loading Spinner */}
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                    <span className="text-gray-300 text-sm">Initializing...</span>
                </div>

                {/* Progress Bar Animation */}
                <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full animate-progress" />
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
