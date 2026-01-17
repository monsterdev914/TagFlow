import { useState } from "react";
import Main from "./pages/Main";
import MainLayout from "./components/main-layout";
import Login from "./pages/Login";
import { Toaster } from "./components/ui/toaster";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = (username: string, password: string) => {
        setIsLoggedIn(true);
    };

    return (
        <>
            {isLoggedIn ? (
                <MainLayout>
                    <Main />
                </MainLayout>
            ) : (
                <Login onLogin={handleLogin} />
            )}
            <Toaster />
        </>
    );
}

export default App;