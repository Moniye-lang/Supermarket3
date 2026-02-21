import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
    return (
        <div className="flex flex-col min-h-screen font-sans text-brand-dark bg-brand-light">
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-grow">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}
