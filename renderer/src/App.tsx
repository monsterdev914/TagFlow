import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Main from "./pages/Main";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import { Toaster } from "./components/ui/toaster";
import ProductionLines from "./pages/ProductionLines";
import Items from "./pages/Items";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<MainLayout />}>
                    <Route path="/main" element={<Main />} />
                    <Route path="/production-lines" element={<ProductionLines />} />
                    <Route path="/items" element={<Items />} />
                </Route>
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster />
        </BrowserRouter>
    );
}

export default App;