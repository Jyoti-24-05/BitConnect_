// client/src/pages/clubs/CreateClubPage.jsx
import { useState }         from "react";
import { useNavigate }      from "react-router-dom";
import { useForm }          from "react-hook-form";
import { zodResolver }      from "@hookform/resolvers/zod";
import { z }                from "zod";
import { Image, X,
         ArrowLeft, Lock,
         Globe, Users }            from "lucide-react";
import { clubApi }          from "@/api/clubApi";
import { CLUB_CATEGORIES }  from "@/utils/constants";
import cn                   from "@/utils/cn";
import toast                from "react-hot-toast";
import { Navigate }         from "react-router-dom";
import useAuth              from "@/hooks/useAuth";
import { Link }       from "react-router-dom";

const schema = z.object({
  name:        z.string().min(3, "Min 3 characters").max(80),
  description: z.string().min(20, "Min 20 characters").max(1000),
  category:    z.enum(["technical","cultural","sports","academic","social","other"],{
    errorMap: () => ({ message: "Please select a category" }),
  }),
  tags:        z.string().optional(),
  instagram:   z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedin:    z.string().url("Invalid URL").optional().or(z.literal("")),
  website:     z.string().url("Invalid URL").optional().or(z.literal("")),
});

const Field = ({ label, error, hint, required, children }) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--tx-muted)" }}>
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint  && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition";

const CreateClubPage = () => {
  const navigate              = useNavigate();
  const { isClub, isAdmin }   = useAuth();
  const [loading, setLoading] = useState(false);
  const [logo,    setLogo]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const handleLogoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const form = new FormData();
      form.append("name",        data.name);
      form.append("description", data.description);
      form.append("category",    data.category);
      form.append("isPrivate",   String(isPrivate)); // ← from state

      if (logo) form.append("logo", logo);

      if (data.tags) {
  const tagArray = data.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Send as JSON string — service parses it
  form.append("tags", tagArray.join(","));
}

      const socialLinks = {
        instagram: data.instagram || "",
        linkedin:  data.linkedin  || "",
        website:   data.website   || "",
      };
      form.append("socialLinks", JSON.stringify(socialLinks));

      const { data: res } = await clubApi.createClub(form);
      toast.success("Club created!");
      navigate(`/clubs/${res.data.slug}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to create club");
      console.error("[Create club error]", err.response?.data);
    } finally {
      setLoading(false);
    }
  };
  if (!isClub && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100
                        shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center
                          justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="font-semibold text-gray-900 mb-2">
            Club accounts only
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Only registered club/organisation accounts can create clubs.
            Register with role <strong>Club</strong> to create one.
          </p>
          <button
            onClick={() => navigate("/clubs")}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl
                       text-sm font-medium hover:bg-indigo-700 transition"
          >
            Browse clubs
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500
                   hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="card rounded-2xl p-6" style={{ background: "var(--card)" }}>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">
          Create a club
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Logo */}
          <div className="flex items-start gap-5">
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Logo"
                     className="w-20 h-20 rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => { setLogo(null); setPreview(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500
                             rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <label className="w-20 h-20 rounded-2xl border-2 border-dashed
                                border-gray-200 flex flex-col items-center
                                justify-center cursor-pointer
                                hover:border-indigo-300 hover:bg-indigo-50/30
                                transition shrink-0">
                <Image className="w-6 h-6 text-gray-300" />
                <span className="text-[10px] text-gray-400 mt-1">Logo</span>
                <input type="file" accept="image/*"
                       className="sr-only" onChange={handleLogoPick} />
              </label>
            )}
            <div className="flex-1">
              <Field label="Club name" required error={errors.name?.message}>
                <input {...register("name")}
                       placeholder="Coding Club BIT"
                       className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Description */}
          <Field label="Description" required error={errors.description?.message}
                 hint="Tell students what your club is about">
            <textarea {...register("description")} rows={4}
                      placeholder="We are a community of passionate developers..."
                      className={cn(inputCls, "resize-none")} />
          </Field>

          {/* Category + Privacy */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required error={errors.category?.message}>
              <select {...register("category")} className={inputCls}>
                <option value="">Select category</option>
                {CLUB_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </Field>

            {/* ── Privacy toggle — plain state, no form field ── */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--tx-muted)" }}>
                Privacy
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5",
                    "border rounded-xl transition text-xs font-medium",
                    !isPrivate
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5",
                    "border rounded-xl transition text-xs font-medium",
                    isPrivate
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Private
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isPrivate
                  ? "Members need approval"
                  : "Anyone can join instantly"}
              </p>
            </div>
          </div>

          {/* Tags */}
          <Field label="Tags" error={errors.tags?.message}
                 hint="Comma separated · max 5 tags">
            <input {...register("tags")}
                   placeholder="coding, web, hackathon"
                   className={inputCls} />
          </Field>

          {/* Social links */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Social links <span className="text-gray-400 font-normal">(optional)</span>
            </p>
            <Field label="Instagram" error={errors.instagram?.message}>
              <input {...register("instagram")}
                     placeholder="https://instagram.com/yourclub"
                     className={inputCls} />
            </Field>
            <Field label="LinkedIn" error={errors.linkedin?.message}>
              <input {...register("linkedin")}
                     placeholder="https://linkedin.com/company/yourclub"
                     className={inputCls} />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <input {...register("website")}
                     placeholder="https://yourclub.bit.ac.in"
                     className={inputCls} />
            </Field>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl
                       font-medium text-sm hover:bg-indigo-700 transition
                       disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white
                               border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Creating club..." : "Create club"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateClubPage;