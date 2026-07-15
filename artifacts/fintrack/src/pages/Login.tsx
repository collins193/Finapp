import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Eye, EyeOff, TrendingUp } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // After login, refetch me to get role — user is now set in context
      // We need to read the user from context after login
      // Use a small delay to let state settle, then check via auth me
      const base = import.meta.env.BASE_URL;
      const r = await fetch(`${base}api/auth/me`, { credentials: "include" });
      if (r.ok) {
        const u = await r.json();
        if (u.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/dashboard");
        }
      } else {
        setLocation("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#0f172a" }}
    >
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center shadow-lg">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">FinTrack</span>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
        className="w-full max-w-md mx-4"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          padding: "2rem",
        }}
      >
        <h1 className="text-xl font-semibold text-white mb-1">Sign in to your account</h1>
        <p className="text-slate-400 text-sm mb-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-green-400 hover:text-green-300 font-medium">
            Register
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-green-500"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-green-500"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg font-semibold text-sm text-white mt-2 transition-all"
            style={{ background: isSubmitting ? "#166534" : "#16a34a" }}
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
