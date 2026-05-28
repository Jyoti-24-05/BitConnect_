// client/src/pages/auth/ForgotPasswordPage.jsx
import { useState }           from "react";
import { Link }               from "react-router-dom";
import { useForm }            from "react-hook-form";
import { zodResolver }        from "@hookform/resolvers/zod";
import { z }                  from "zod";
import toast                  from "react-hot-toast";
import { authApi }            from "@/api/authApi";

const schema = z.object({
  email: z.string().email("Invalid email"),
});

const ForgotPasswordPage = () => {
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const { register, handleSubmit,
          formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data);
      setSent(true);
    } catch {
      toast.error("Something went wrong — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="card rounded-2xl" style={{ background: "var(--card)" }}>
          {sent ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center
                              justify-center mx-auto text-2xl">✉️</div>
              <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
              <p className="text-sm" style={{ color: "var(--tx-muted)" }}>
                If this email exists, a reset link has been sent.
                Check your inbox and spam folder.
              </p>
              <Link to="/login" className="text-indigo-600 text-sm hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Reset your password
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send a reset link.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <input {...register("email")} type="email"
                         placeholder="you@bit.ac.in"
                         className="w-full px-4 py-2.5 border border-gray-200
                                    rounded-xl text-sm outline-none
                                    focus:ring-2 focus:ring-indigo-300 transition" />
                  {errors.email && (
                    <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.email.message}</p>
                  )}
                </div>
                <button type="submit" disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl
                                   text-sm font-medium hover:bg-indigo-700 transition
                                   disabled:opacity-60">
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <Link to="/login"
                    className="block text-center text-sm text-indigo-600
                               hover:underline mt-4">
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;