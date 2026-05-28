// client/src/pages/profile/EditProfilePage.jsx
import { useState, useEffect }    from "react";
import { useNavigate }            from "react-router-dom";
import { useForm }                from "react-hook-form";
import { zodResolver }            from "@hookform/resolvers/zod";
import { z }                      from "zod";
import {
  ArrowLeft, Camera, X,
  Plus, Eye, EyeOff,
}                                 from "lucide-react";
import { authApi }                from "@/api/authApi";
import useAuth                    from "@/hooks/useAuth";
import { PageSpinner }            from "@/components/common/Spinner";
import cn                         from "@/utils/cn";
import toast                      from "react-hot-toast";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter
} from "react-icons/fa";

// ─── Schemas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  bio:            z.string().max(200, "Max 200 chars").optional().default(""),
  college:        z.string().max(100).optional().default(""),
  graduationYear: z.string().optional().default(""),
  gender:         z.enum(["male","female","non-binary","prefer-not-to-say",""])
                    .optional().default(""),
});

const linksSchema = z.object({
  github:   z.string().url("Invalid URL").optional().or(z.literal("")).default(""),
  linkedin: z.string().url("Invalid URL").optional().or(z.literal("")).default(""),
  twitter:  z.string().url("Invalid URL").optional().or(z.literal("")).default(""),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(8, "Min 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Must have uppercase, lowercase, number and special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  });

// ─── Reusable field ───────────────────────────────────────────────────────────
const Field = ({ label, error, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--tx-muted)" }}>
      {label}
    </label>
    {children}
    {hint  && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition";

// ─── Main component ───────────────────────────────────────────────────────────
const EditProfilePage = () => {
  const navigate             = useNavigate();
  const { user, updateUser } = useAuth();

  const [section,     setSection]     = useState("profile");
  const [saving,      setSaving]      = useState(false);
  const [avatar,      setAvatar]      = useState(null);
  const [preview,     setPreview]     = useState("");
  const [skills,      setSkills]      = useState([]);
  const [skillInput,  setSkillInput]  = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);

  // ── Profile form ─────────────────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    watch,
    formState: { errors: profileErrors },
  } = useForm({ resolver: zodResolver(profileSchema) });

  // ── Links form ────────────────────────────────────────────────────────────
  const {
    register: regLinks,
    handleSubmit: submitLinks,
    reset: resetLinks,
    formState: { errors: linkErrors },
  } = useForm({ resolver: zodResolver(linksSchema) });

  // ── Password form ─────────────────────────────────────────────────────────
  const {
    register: regPw,
    handleSubmit: submitPw,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const bio = watch("bio") ?? "";

  // ── Populate forms on load ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    resetProfile({
      bio:            user.bio            ?? "",
      college:        user.college        ?? "",
      graduationYear: user.graduationYear?.toString() ?? "",
      gender:         user.gender         ?? "",
    });
    resetLinks({
      github:   user.socialLinks?.github   ?? "",
      linkedin: user.socialLinks?.linkedin ?? "",
      twitter:  user.socialLinks?.twitter  ?? "",
    });
    setSkills(user.skills ?? []);
    setPreview(user.profilePicture ?? "");
  }, [user]);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Photo under 2MB only"); return; }
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Skills ────────────────────────────────────────────────────────────────
  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s) || skills.length >= 15) return;
    setSkills((p) => [...p, s]);
    setSkillInput("");
  };

  // ── Save profile info ─────────────────────────────────────────────────────
  const onSaveProfile = async (data) => {
    setSaving(true);
    try {
      const form = new FormData();
      if (avatar)            form.append("profilePicture", avatar);
      if (data.bio)          form.append("bio",            data.bio);
      if (data.college)      form.append("college",        data.college);
      if (data.graduationYear)
                             form.append("graduationYear", data.graduationYear);
      if (data.gender)       form.append("gender",         data.gender);

      const { data: res } = await authApi.updateProfile(form);
      updateUser(res.data);
      toast.success("Profile info saved!");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to save");
      console.error(err.response?.data);
    } finally {
      setSaving(false);
    }
  };

  // ── Save skills + links ───────────────────────────────────────────────────
  const onSaveLinks = async (data) => {
    setSaving(true);
    try {
      const form = new FormData();
      // Skills as JSON string — validator parses it back
      form.append("skills",      JSON.stringify(skills));
      form.append("socialLinks", JSON.stringify({
        github:   data.github   || "",
        linkedin: data.linkedin || "",
        twitter:  data.twitter  || "",
      }));

      const { data: res } = await authApi.updateProfile(form);
      updateUser(res.data);
      toast.success("Skills and links saved!");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to save");
      console.error(err.response?.data);
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const onChangePassword = async (data) => {
    setSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success("Password changed — please login again");
      resetPw();
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <PageSpinner />;

  const SECTIONS = [
    { key: "profile",  label: "Profile"  },
    { key: "skills",   label: "Skills"   },
    { key: "password", label: "Password" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      <button
        onClick={() => navigate(`/profile/${user.username}`)}
        className="flex items-center gap-2 text-sm text-gray-500
                   hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to profile
      </button>

      <div className="card rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>

        {/* Section tabs */}
        <div className="flex border-b border-gray-100">
          {SECTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={cn(
                "flex-1 py-3.5 text-sm font-medium transition border-b-2",
                section === key
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── Profile info ── */}
          {section === "profile" && (
            <form onSubmit={submitProfile(onSaveProfile)} className="space-y-5">

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  {preview ? (
                    <img src={preview} alt="Profile"
                         className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-100
                                    flex items-center justify-center
                                    text-indigo-600 text-2xl font-semibold">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-7 h-7
                                    bg-indigo-600 rounded-full flex items-center
                                    justify-center cursor-pointer
                                    hover:bg-indigo-700 transition">
                    <Camera className="w-3.5 h-3.5 text-white" />
                    <input type="file" accept="image/*"
                           className="sr-only" onChange={handleAvatarPick} />
                  </label>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                </div>
              </div>

              {/* Bio */}
              <Field label="Bio" error={profileErrors.bio?.message}
                     hint={`${bio.length}/200 characters`}>
                <textarea
                  {...regProfile("bio")}
                  rows={3}
                  maxLength={200}
                  placeholder="Tell your community about yourself..."
                  className={cn(inputCls, "resize-none")}
                />
              </Field>

              {/* College + Year */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="College" error={profileErrors.college?.message}>
                  <input {...regProfile("college")}
                         placeholder="BIT Mesra" className={inputCls} />
                </Field>
                <Field label="Graduation year"
                       error={profileErrors.graduationYear?.message}>
                  <input {...regProfile("graduationYear")} type="number"
                         placeholder="2026" min="2000" max="2035"
                         className={inputCls} />
                </Field>
              </div>

              {/* Gender */}
              <Field label="Gender" error={profileErrors.gender?.message}>
                <select {...regProfile("gender")} className={inputCls}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </Field>

              <button type="submit" disabled={saving}
                      className="w-full py-2.5 bg-indigo-600 text-white
                                 rounded-xl text-sm font-medium
                                 hover:bg-indigo-700 transition
                                 disabled:opacity-60 flex items-center
                                 justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white
                                            border-t-transparent rounded-full
                                            animate-spin" />}
                {saving ? "Saving..." : "Save profile"}
              </button>
            </form>
          )}

          {/* ── Skills & links ── */}
          {section === "skills" && (
            <div className="space-y-6">

              {/* Skills — NOT a form, just state */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--tx-muted)" }}>
                  Skills
                  <span className="text-gray-400 font-normal ml-1">(max 15)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addSkill(); }
                    }}
                    placeholder="e.g. React, Python..."
                    className={cn(inputCls, "flex-1")}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    disabled={!skillInput.trim() || skills.length >= 15}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl
                               text-sm hover:bg-indigo-700 transition
                               disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map((skill) => (
                      <span key={skill}
                            className="flex items-center gap-1.5 text-xs
                                       font-medium text-indigo-700 bg-indigo-50
                                       px-3 py-1.5 rounded-full">
                        {skill}
                        <button type="button"
                                onClick={() => setSkills((p) => p.filter((s) => s !== skill))}
                                className="text-indigo-400 hover:text-red-500 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Social links — separate form */}
              <form onSubmit={submitLinks(onSaveLinks)} className="space-y-4">
                <p className="text-sm font-medium text-gray-700 border-t
                               border-gray-100 pt-4">
                  Social links
                </p>

                <Field label="GitHub" error={linkErrors.github?.message}>
                  <div className="relative">
                    <FaGithub className="absolute left-3 top-1/2 -translate-y-1/2
                                       w-4 h-4 text-gray-400" />
                    <input {...regLinks("github")}
                           placeholder="https://github.com/username"
                           className={cn(inputCls, "pl-9")} />
                  </div>
                </Field>

                <Field label="LinkedIn" error={linkErrors.linkedin?.message}>
                  <div className="relative">
                    <FaLinkedin className="absolute left-3 top-1/2 -translate-y-1/2
                                         w-4 h-4 text-gray-400" />
                    <input {...regLinks("linkedin")}
                           placeholder="https://linkedin.com/in/username"
                           className={cn(inputCls, "pl-9")} />
                  </div>
                </Field>

                <Field label="Twitter / X" error={linkErrors.twitter?.message}>
                  <div className="relative">
                    <FaTwitter className="absolute left-3 top-1/2 -translate-y-1/2
                                        w-4 h-4 text-gray-400" />
                    <input {...regLinks("twitter")}
                           placeholder="https://twitter.com/username"
                           className={cn(inputCls, "pl-9")} />
                  </div>
                </Field>

                <button type="submit" disabled={saving}
                        className="w-full py-2.5 bg-indigo-600 text-white
                                   rounded-xl text-sm font-medium
                                   hover:bg-indigo-700 transition
                                   disabled:opacity-60 flex items-center
                                   justify-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white
                                              border-t-transparent rounded-full
                                              animate-spin" />}
                  {saving ? "Saving..." : "Save skills & links"}
                </button>
              </form>
            </div>
          )}

          {/* ── Password ── */}
          {section === "password" && (
            <form onSubmit={submitPw(onChangePassword)} className="space-y-5">

              <div className="bg-amber-50 border border-amber-100
                              rounded-xl px-4 py-3">
                <p className="text-sm text-amber-800">
                  Changing your password logs you out of all devices.
                </p>
              </div>

              <Field label="Current password"
                     error={pwErrors.currentPassword?.message}>
                <div className="relative">
                  <input {...regPw("currentPassword")}
                         type={showCurrent ? "text" : "password"}
                         placeholder="••••••••"
                         className={cn(inputCls, "pr-10")} />
                  <button type="button"
                          onClick={() => setShowCurrent((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2
                                     text-gray-400 hover:text-gray-600 transition">
                    {showCurrent
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye    className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field label="New password" error={pwErrors.newPassword?.message}
                     hint="Min 8 chars · uppercase · number · special character">
                <div className="relative">
                  <input {...regPw("newPassword")}
                         type={showNew ? "text" : "password"}
                         placeholder="••••••••"
                         className={cn(inputCls, "pr-10")} />
                  <button type="button"
                          onClick={() => setShowNew((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2
                                     text-gray-400 hover:text-gray-600 transition">
                    {showNew
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye    className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm new password"
                     error={pwErrors.confirmPassword?.message}>
                <input {...regPw("confirmPassword")}
                       type="password" placeholder="••••••••"
                       className={inputCls} />
              </Field>

              <button type="submit" disabled={saving}
                      className="w-full py-2.5 bg-red-600 text-white
                                 rounded-xl text-sm font-medium
                                 hover:bg-red-700 transition disabled:opacity-60
                                 flex items-center justify-center gap-2">
                {saving && <span className="w-4 h-4 border-2 border-white
                                            border-t-transparent rounded-full
                                            animate-spin" />}
                {saving ? "Changing..." : "Change password"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;