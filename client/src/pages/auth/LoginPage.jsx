// client/src/pages/auth/LoginPage.jsx
import { useState }          from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm }           from "react-hook-form";
import { zodResolver }       from "@hookform/resolvers/zod";
import { z }                 from "zod";
import toast                 from "react-hot-toast";
import { useDispatch }       from "react-redux";
import { authApi }           from "@/api/authApi";
import { setCredentials }    from "@/store/slices/authSlice";
import useAuth             from "@/hooks/useAuth";

const schema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// Define outside component — never inside JSX
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:8000";

const LoginPage = () => {
  const {login}= useAuth();
  const navigate              = useNavigate();
  const dispatch             = useDispatch();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
  setLoading(true);
  try {
    await login(data); // use AuthContext login — it handles everything
    toast.success("Welcome back!");
    navigate("/feed", { replace: true });
  } catch (err) {
    const msg = err.response?.data?.message ?? "Login failed";
    toast.error(msg);
    console.error("[Login error]", err.response?.data);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white
                    flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">BitConnect</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@bit.ac.in"
                autoComplete="email"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                           text-sm outline-none focus:ring-2 focus:ring-indigo-300
                           focus:border-indigo-300 transition"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                           text-sm outline-none focus:ring-2 focus:ring-indigo-300
                           focus:border-indigo-300 transition"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link to="/forgot-password"
                    className="text-xs text-indigo-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl
                         font-medium text-sm hover:bg-indigo-700 transition
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* OAuth */}
          <div className="mt-6">
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={`${SERVER_URL}/api/v1/auth/google`}
                className="flex items-center justify-center gap-2 py-2.5
                           border border-gray-200 rounded-xl text-sm
                           text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                 Google
              </a>
              <a
                href={`${SERVER_URL}/api/v1/auth/github`}
                className="flex items-center justify-center gap-2 py-2.5
                           border border-gray-200 rounded-xl text-sm
                           text-gray-600 hover:bg-gray-50 transition font-medium"
              >
                 GitHub
              </a>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register"
                  className="text-indigo-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;