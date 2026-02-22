import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-brand-light px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-[-10%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 left-[-10%] w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[120px]" />
            </div>

            <div className="text-center relative z-10 max-w-lg">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="relative inline-block mb-8"
                >
                    <span className="text-[12rem] font-display font-black text-brand-primary/10 leading-none">404</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-brand-primary/10 rounded-3xl rotate-12 absolute animate-pulse" />
                        <div className="w-32 h-32 bg-brand-primary rounded-3xl -rotate-12 flex items-center justify-center shadow-2xl shadow-brand-primary/30">
                            <span className="text-5xl font-bold text-white">!</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <h1 className="text-4xl font-display font-bold text-brand-dark">Oops! Page Lost in Delivery</h1>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        We couldn't find the page you're looking for. It might have been moved, or perhaps it was never in our inventory.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            onClick={() => navigate("/")}
                            size="lg"
                            className="rounded-full px-8 w-full sm:w-auto shadow-brand-primary/25 shadow-xl"
                        >
                            <Home className="mr-2 w-5 h-5" /> Back to Home
                        </Button>
                        <Button
                            onClick={() => navigate(-1)}
                            variant="outline"
                            size="lg"
                            className="rounded-full px-8 w-full sm:w-auto border-gray-200"
                        >
                            <ArrowLeft className="mr-2 w-5 h-5" /> Go Back
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
