"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { AuthContext } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://supermarket3.vercel.app/";

export default function SignIn() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && showForgotPassword) handleBackToLogin(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showForgotPassword]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  useEffect(() => { setPasswordStrength(calculatePasswordStrength(newPassword)); }, [newPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      login(data.user, data.token);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());
        const backendRes = await fetch(`${API_URL}/api/auth/google-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token, googleId: userInfo.sub, email: userInfo.email, name: userInfo.name }),
        });
        const data = await backendRes.json();
        if (!backendRes.ok) throw new Error(data.error || "Google Login failed");
        login(data.user, data.token);
        router.push("/");
      } catch (err: any) {
        setError(err.message || "Google Login failed. Please try again.");
        setLoading(false);
      }
    },
    onError: () => { setError("Google Login Failed"); setLoading(false); },
  });

  async function handleForgotPasswordRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setForgotMessage("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) { setError("Please enter a valid email address"); setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      if (data.otp) { setForgotMessage(`[DEV MODE] OTP is: ${data.otp}`); setForgotOtp(data.otp); }
      else setForgotMessage("OTP sent to your email");
      setForgotStep(2); setResendTimer(60);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleResendOtp() {
    if (resendTimer > 0) return;
    setLoading(true); setError(""); setForgotMessage("");
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");
      if (data.otp) { setForgotMessage(`[DEV MODE] New OTP is: ${data.otp}`); setForgotOtp(data.otp); }
      else setForgotMessage("New OTP sent to your email");
      setResendTimer(60);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setForgotMessage("");
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-reset-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      setForgotMessage("OTP verified"); setForgotStep(3);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setForgotMessage("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setForgotMessage("Password reset successfully"); setForgotStep(4);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  function handleBackToLogin() {
    setShowForgotPassword(false); setForgotStep(1); setForgotEmail(""); setForgotOtp("");
    setNewPassword(""); setConfirmPassword(""); setError(""); setForgotMessage(""); setResendTimer(0); setPasswordStrength(0);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-light relative overflow-hidden px-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10 relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-3xl font-display font-bold text-brand-dark">AM<span className="text-brand-primary">Stores</span></h1>
          </Link>
          <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue shopping</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input type="email" placeholder="Email Address" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} icon={<Mail size={18} className="text-gray-400" />} required />
          <Input type="password" placeholder="Password" value={form.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })} icon={<Lock size={18} className="text-gray-400" />} required />

          <div className="text-right">
            <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-brand-primary hover:underline font-medium">Forgot Password?</button>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">{error}</div>}

          <Button type="submit" className="w-full py-6 text-lg shadow-brand-primary/25 shadow-xl group" disabled={loading}>
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white/80 px-2 text-gray-500">Or continue with</span></div>
          </div>

          <button type="button" onClick={() => handleGoogleLogin()} className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium shadow-sm">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            Sign in with Google
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">Don&apos;t have an account?{" "}<Link href="/signup" className="text-brand-primary font-semibold hover:underline">Sign Up</Link></p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === forgotStep ? "bg-brand-primary text-white" : step < forgotStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {step < forgotStep ? "✓" : step}
                  </div>
                  {step < 4 && <div className={`w-12 h-1 mx-1 ${step < forgotStep ? "bg-green-500" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
              <p className="text-gray-500 text-sm mt-1">
                {forgotStep === 1 && "Enter your email to receive a verification code"}
                {forgotStep === 2 && "Enter the verification code sent to your email"}
                {forgotStep === 3 && "Create your new password"}
                {forgotStep === 4 && "Password reset successful"}
              </p>
            </div>

            {forgotMessage && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg text-center mb-4">{forgotMessage}</div>}
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center mb-4">{error}</div>}

            {forgotStep === 1 && (
              <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                <Input type="email" placeholder="Email Address" value={forgotEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotEmail(e.target.value)} icon={<Mail size={18} className="text-gray-400" />} required />
                <Button type="submit" className="w-full py-4" disabled={loading}>{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Send Verification Code"}</Button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input type="text" placeholder="Verification Code" value={forgotOtp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotOtp(e.target.value)} maxLength={6} required />
                <Button type="submit" className="w-full py-4" disabled={loading}>{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Verify Code"}</Button>
                <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0 || loading} className="w-full text-sm text-brand-primary hover:underline disabled:text-gray-400 disabled:no-underline">
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Input type="password" placeholder="New Password" value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} icon={<Lock size={18} className="text-gray-400" />} required />
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div key={level} className={`h-1 flex-1 rounded ${passwordStrength >= level ? passwordStrength <= 2 ? "bg-red-500" : passwordStrength <= 3 ? "bg-yellow-500" : "bg-green-500" : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{passwordStrength <= 2 && "Weak password"}{passwordStrength === 3 && "Medium password"}{passwordStrength >= 4 && "Strong password"}</p>
                    </div>
                  )}
                </div>
                <Input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} icon={<Lock size={18} className="text-gray-400" />} required />
                <Button type="submit" className="w-full py-4" disabled={loading}>{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Reset Password"}</Button>
              </form>
            )}

            {forgotStep === 4 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-gray-600">Your password has been successfully reset. You can now login with your new password.</p>
                <Button onClick={handleBackToLogin} className="w-full py-4">Back to Login</Button>
              </div>
            )}

            {forgotStep !== 4 && <button onClick={handleBackToLogin} className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700">Back to Login</button>}
          </motion.div>
        </div>
      )}
    </div>
  );
}
