// client/src/pages/auth/LoginPage.jsx
import { useState }          from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm }           from "react-hook-form";
import { zodResolver }       from "@hookform/resolvers/zod";
import { z }                 from "zod";
import toast                 from "react-hot-toast";
import { useDispatch }       from "react-redux";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { authApi }           from "@/api/authApi";
import { setCredentials }    from "@/store/slices/authSlice";
import useAuth             from "@/hooks/useAuth";

const schema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:8000";

const LoginPage = () => {
  const { login }             = useAuth();
  const navigate              = useNavigate();
  const dispatch              = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data);
      toast.success("Welcome back! ✨");
      navigate("/feed", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
         style={{ background: "var(--bg)" }}>
      {/* Decorative blobs */}
      <div className="auth-blob w-96 h-96 -top-24 -left-24 opacity-40"
           style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
      <div className="auth-blob w-80 h-80 -bottom-20 -right-20 opacity-30"
           style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
      <div className="auth-blob w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"
           style={{ background: "radial-gradient(circle, #c084fc 0%, transparent 70%)" }} />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              <span className="text-white font-bold text-xl" style={{ fontFamily: "Syne, sans-serif" }}>B</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: "Syne, sans-serif" }}>
              BitConnect
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--tx-muted)" }}>
            Your institute social network
          </p>
        </div>

        <div className="card rounded-2xl p-8 fade-in-up" style={{ animationDelay: "60ms" }}>
          <h2 className="text-xl font-bold mb-6 text-center" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>
            Sign in to continue
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                     style={{ color: "var(--tx-muted)" }}>
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@bit.ac.in"
                autoComplete="email"
                className="input-base w-full px-4 py-2.5 text-sm"
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                     style={{ color: "var(--tx-muted)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input-base w-full px-4 py-2.5 text-sm pr-10"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                        style={{ color: "var(--tx-muted)" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "var(--p500)" }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
                    className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Sign in</>
              )}
            </button>
          </form>

          {/* OAuth */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--tx-light)" }}>or continue with</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { href: `${SERVER_URL}/api/v1/auth/google`, label: " Google" },
                { href: `${SERVER_URL}/api/v1/auth/github`, label: " GitHub" },
              ].map(({ href, label }) => (
                <a key={label} href={href}
                   className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all btn-ghost">
                  {label}
                </a>
              ))}
            </div>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: "var(--tx-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: "var(--p500)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
