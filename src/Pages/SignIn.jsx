import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { AuthContext } from "../context/AuthContext";

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      login(data.user, data.token);

      // Redirect based on details/role
      if (data.user.isAdmin) navigate("/admin");
      else navigate("/");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());

        const backendRes = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/auth/google-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenResponse.access_token,
            googleId: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name
          }),
        });

        const data = await backendRes.json();
        if (!backendRes.ok) throw new Error(data.error || "Google Login failed");

        login(data.user, data.token);
        navigate("/");

      } catch (err) {
        setError("Google Login failed. Please try again.");
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google Login Failed");
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-light relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-4">
            <h1 className="text-3xl font-display font-bold text-brand-dark">
              AM<span className="text-brand-primary">Stores</span>
            </h1>
          </Link>
          <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue shopping</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              icon={<Mail size={18} className="text-gray-400" />}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              icon={<Lock size={18} className="text-gray-400" />}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-6 text-lg shadow-brand-primary/25 shadow-xl group"
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/80 px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium shadow-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            Sign in with Google
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-brand-primary font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

