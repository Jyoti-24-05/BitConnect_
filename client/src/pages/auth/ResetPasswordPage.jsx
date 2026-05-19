// client/src/pages/auth/ResetPasswordPage.jsx
import { useState }                     from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm }                      from "react-hook-form";
import { zodResolver }                  from "@hookform/resolvers/zod";
import { z }                            from "zod";
import toast                            from "react-hot-toast";
import { authApi }                      from "@/api/authApi";

const schema = z.object({
  password: z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Must include uppercase, lowercase, number & special character"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path:    ["confirmPassword"],
});

const ResetPasswordPage = () => {
  const navigate              = useNavigate();
  const [params]              = useSearchParams();
  const [loading, setLoading] = useState(false);
  const token                 = params.get("token");

  const { register, handleSubmit,
          formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }) => {
    if (!token) return toast.error("Invalid reset link");
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast.success("Password reset — please login");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Link expired — request a new one");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white
                    flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Set new password</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input {...register("password")} type="password" placeholder="••••••••"
                     className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                                text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input {...register("confirmPassword")} type="password" placeholder="••••••••"
                     className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                                text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl
                               text-sm font-medium hover:bg-indigo-700 transition
                               disabled:opacity-60">
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ResetPasswordPage;