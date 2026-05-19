// client/src/pages/auth/RegisterPage.jsx
import { useState }           from "react";
import { Link, useNavigate }  from "react-router-dom";
import { useForm }            from "react-hook-form";
import { zodResolver }        from "@hookform/resolvers/zod";
import { z }                  from "zod";
import toast                  from "react-hot-toast";
import useAuth                from "@/hooks/useAuth";

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  email:    z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Min 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Must include uppercase, lowercase, number & special character"),
  role: z.enum(["student", "club"]),
});

const RegisterPage = () => {
  const { login }             = useAuth();
  const navigate              = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit,
          formState: { errors } } = useForm({
    resolver:     zodResolver(schema),
    defaultValues: { role: "student" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { authApi } = await import("@/api/authApi");
      await authApi.register(data);
      await login({ email: data.email, password: data.password });
      toast.success("Account created!");
      navigate("/feed");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white
                    flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">BitConnect</h1>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["student", "club"].map((r) => (
                  <label key={r}
                         className="relative flex items-center justify-center
                                    border rounded-xl py-2.5 cursor-pointer
                                    has-[:checked]:border-indigo-500
                                    has-[:checked]:bg-indigo-50 transition">
                    <input {...register("role")} type="radio" value={r}
                           className="sr-only" />
                    <span className="text-sm font-medium capitalize text-gray-700">
                      {r === "club" ? "Club / Organiser" : "Student"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input {...register("username")} placeholder="john_doe"
                     className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                                text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input {...register("email")} type="email" placeholder="you@bit.ac.in"
                     className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                                text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input {...register("password")} type="password" placeholder="••••••••"
                     className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                                text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={loading}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl
                               font-medium text-sm hover:bg-indigo-700 transition
                               disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;