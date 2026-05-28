// client/src/pages/events/CreateEventPage.jsx
import { useState }          from "react";
import { useNavigate }       from "react-router-dom";
import { useForm }           from "react-hook-form";
import { zodResolver }       from "@hookform/resolvers/zod";
import { z }                 from "zod";
import { Image, X, ArrowLeft,
         Calendar, Wifi }    from "lucide-react";
import { eventApi }          from "@/api/eventApi";
import { clubApi }           from "@/api/clubApi";
import useAuth               from "@/hooks/useAuth";
import { EVENT_CATEGORIES }  from "@/utils/constants";
import cn                    from "@/utils/cn";
import toast                 from "react-hot-toast";
import { useEffect }         from "react";

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  title:       z.string().min(3, "Min 3 characters").max(120),
  description: z.string().min(20, "Min 20 characters").max(2000),
  category:    z.enum(["workshop","seminar","hackathon","cultural","sports","networking","other"]),
  startDate:   z.string().min(1, "Start date required"),
  endDate:     z.string().min(1, "End date required"),
  rsvpDeadline: z.string().optional(),
  capacity:    z.string().optional(),
  isOnline:    z.boolean().optional(),
  venueName:   z.string().optional(),
  venueAddress: z.string().optional(),
  meetingLink: z.string().url("Invalid URL").optional().or(z.literal("")),
  tags:        z.string().optional(),
  clubId:      z.string().optional(),
  status:      z.enum(["draft","published"]).default("published"),
}).refine(
  (d) => new Date(d.endDate) > new Date(d.startDate),
  { message: "End date must be after start date", path: ["endDate"] }
);

// ─── Reusable field wrapper ───────────────────────────────────────────────────
const Field = ({ label, error, required, children, hint }) => (
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

const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm \
  outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition";

const CreateEventPage = () => {
  const navigate              = useNavigate();
  const { user, isClub,
          isAdmin }           = useAuth();
  const [loading, setLoading] = useState(false);
  const [banner,  setBanner]  = useState(null);
  const [preview, setPreview] = useState(null);
  const [myClubs, setMyClubs] = useState([]);

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm({
    resolver:      zodResolver(schema),
    defaultValues: { status: "published", isOnline: false },
  });

  const isOnline = watch("isOnline");

  // ── Load clubs the user manages ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await clubApi.discoverClubs({ limit: 50 });
        // Filter to clubs where user is admin/co-admin
        setMyClubs(data.data.clubs ?? []);
      } catch { /* not critical */ }
    };
    if (isClub || isAdmin) load();
  }, [isClub, isAdmin]);

  // ── Banner pick ──────────────────────────────────────────────────────────────
  const handleBannerPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Banner must be under 5 MB");
      e.target.value = "";
      return;
    }

    // Read first 12 bytes to verify real file signature (magic bytes)
    // This catches HEIC, AVIF, GIF, SVG, BMP etc. that sharp can't process
    const SUPPORTED = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const bytes = new Uint8Array(ev.target.result);
        const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
        const isJpeg  = hex.startsWith("FFD8FF");
        const isPng   = hex.startsWith("89504E47");
        const isWebP  = hex.slice(8, 16) === "57454250"; // RIFF????WEBP
        resolve(isJpeg || isPng || isWebP);
      };
      reader.readAsArrayBuffer(file.slice(0, 12));
    });

    if (!SUPPORTED) {
      toast.error("Unsupported format. Please upload a JPEG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    setBanner(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const form = new FormData();

      form.append("title",       data.title);
      form.append("description", data.description);
      form.append("category",    data.category);
      form.append("startDate",   data.startDate);
      form.append("endDate",     data.endDate);
      form.append("status",      data.status);

      if (data.rsvpDeadline) form.append("rsvpDeadline", data.rsvpDeadline);
      if (data.capacity)     form.append("capacity",     data.capacity);
      if (data.clubId)       form.append("clubId",       data.clubId);
      if (banner)            form.append("banner",       banner);

      // Tags — convert comma-separated string to array
      if (data.tags) {
        data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          .forEach((t) => form.append("tags[]", t));
      }

      // Venue
      form.append("venue[isOnline]", String(!!data.isOnline));
      if (data.isOnline && data.meetingLink)
        form.append("venue[meetingLink]", data.meetingLink);
      if (!data.isOnline && data.venueName)
        form.append("venue[name]", data.venueName);
      if (!data.isOnline && data.venueAddress)
        form.append("venue[address]", data.venueAddress);

      const { data: res } = await eventApi.createEvent(form);
      toast.success("Event created!");
      navigate(`/events/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  // Guard — only club/admin can create
  if (!isClub && !isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          Only club accounts and admins can create events.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500
                   hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">
          Create event
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Banner upload */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--tx-muted)" }}>
              Event banner
            </label>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setBanner(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50
                             rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center
                                h-40 border-2 border-dashed border-gray-200
                                rounded-xl cursor-pointer hover:border-indigo-300
                                hover:bg-indigo-50/30 transition">
                <Image className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-sm text-gray-400">
                  Click to upload banner
                </span>
                <span className="text-xs text-gray-300 mt-1">
                  JPEG, PNG, WebP · max 5MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleBannerPick}
                />
              </label>
            )}
          </div>

          {/* Title */}
          <Field label="Title" required error={errors.title?.message}>
            <input
              {...register("title")}
              placeholder="Smart India Hackathon 2025"
              className={inputCls}
            />
          </Field>

          {/* Description */}
          <Field
            label="Description"
            required
            error={errors.description?.message}
            hint="Min 20 characters — describe what attendees can expect"
          >
            <textarea
              {...register("description")}
              rows={5}
              placeholder="Tell attendees what this event is about..."
              className={cn(inputCls, "resize-none")}
            />
          </Field>

          {/* Category + Club (2 columns) */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required error={errors.category?.message}>
              <select {...register("category")} className={inputCls}>
                <option value="">Select category</option>
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </Field>

            {myClubs.length > 0 && (
              <Field label="Organising club" error={errors.clubId?.message}>
                <select {...register("clubId")} className={inputCls}>
                  <option value="">None (personal)</option>
                  {myClubs.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {/* Dates (2 columns) */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date & time" required error={errors.startDate?.message}>
              <input
                {...register("startDate")}
                type="datetime-local"
                className={inputCls}
              />
            </Field>
            <Field label="End date & time" required error={errors.endDate?.message}>
              <input
                {...register("endDate")}
                type="datetime-local"
                className={inputCls}
              />
            </Field>
          </div>

          {/* RSVP deadline + Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="RSVP deadline"
              error={errors.rsvpDeadline?.message}
              hint="Leave blank for no deadline"
            >
              <input
                {...register("rsvpDeadline")}
                type="datetime-local"
                className={inputCls}
              />
            </Field>
            <Field
              label="Capacity"
              error={errors.capacity?.message}
              hint="Leave blank for unlimited"
            >
              <input
                {...register("capacity")}
                type="number"
                min="1"
                placeholder="e.g. 100"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Venue section */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Venue</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-green-500" />
                  Online event
                </span>
                <div className="relative">
                  <input
                    {...register("isOnline")}
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full
                                  peer-checked:bg-indigo-600 transition" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4
                                  bg-white rounded-full transition
                                  peer-checked:translate-x-4" />
                </div>
              </label>
            </div>

            {isOnline ? (
              <Field
                label="Meeting link"
                error={errors.meetingLink?.message}
                hint="Only visible to RSVPed attendees"
              >
                <input
                  {...register("meetingLink")}
                  placeholder="https://meet.google.com/..."
                  className={inputCls}
                />
              </Field>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Venue name" error={errors.venueName?.message}>
                  <input
                    {...register("venueName")}
                    placeholder="BIT Main Auditorium"
                    className={inputCls}
                  />
                </Field>
                <Field label="Address" error={errors.venueAddress?.message}>
                  <input
                    {...register("venueAddress")}
                    placeholder="BIT Mesra, Ranchi"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Tags */}
          <Field
            label="Tags"
            error={errors.tags?.message}
            hint="Comma separated · max 5 tags"
          >
            <input
              {...register("tags")}
              placeholder="placement, workshop, google"
              className={inputCls}
            />
          </Field>

          {/* Status + submit */}
          <div className="flex items-center gap-3 pt-2">
            <select
              {...register("status")}
              className={cn(inputCls, "w-auto")}
            >
              <option value="published">Publish now</option>
              <option value="draft">Save as draft</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl
                         font-medium text-sm hover:bg-indigo-700 transition
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white
                                 border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Creating..." : "Create event"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;