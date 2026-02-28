import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      setSuccessMsg(data.message);
      setStep(2); // Move to OTP step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://supermarket3.onrender.com"}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-light relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[120px]" />
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
          <h2 className="text-xl font-semibold text-gray-800">
            {step === 1 ? "Create Account" : "Verify Email"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 ? "Join us for a premium shopping experience" : `Enter the code sent to ${form.email}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRegister}
              className="space-y-6"
            >
              <div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  icon={<User size={18} className="text-gray-400" />}
                  required
                />
              </div>
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
                  <>Next Step <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerify}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <Mail size={32} />
                </div>
                <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">
                  {successMsg}
                </p>
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="Enter OTP Code"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  icon={<CheckCircle size={18} className="text-gray-400" />}
                  required
                  className="text-center tracking-widest text-lg font-mono"
                  maxLength={6}
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
                  <>Verify & Login <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-gray-500 text-sm hover:text-gray-700"
              >
                Back to Details
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{" "}
            <Link to="/signin" className="text-brand-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
