// client/src/components/feed/CreatePostBox.jsx
import { useState }     from "react";
import { Image, X, Hash, Sparkles } from "lucide-react";
import { useDispatch }  from "react-redux";
import { prependPost }  from "@/store/slices/postSlice";
import { postApi }      from "@/api/postApi";
import useAuth          from "@/hooks/useAuth";
import toast            from "react-hot-toast";

const CreatePostBox = () => {
  const { user }              = useAuth();
  const dispatch              = useDispatch();
  const [content, setContent] = useState("");
  const [images,  setImages]  = useState([]);
  const [type,    setType]    = useState("general");
  const [loading, setLoading] = useState(false);
  const [expanded, setExp]    = useState(false);

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    setImages(files);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return toast.error("Write something first");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("content", content);
      form.append("type", type);
      images.forEach((f) => form.append("images", f));
      const { data } = await postApi.createPost(form);
      dispatch(prependPost(data.data));
      setContent(""); setImages([]); setType("general"); setExp(false);
      toast.success("Post shared! ✨");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card rounded-2xl p-4 fade-in-up" style={{ background: "var(--card)" }}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {user?.profilePicture ? (
            <div className="story-ring">
              <div className="story-ring-inner">
                <img src={user.profilePicture} alt={user?.username}
                     className="w-9 h-9 rounded-full object-cover block" />
              </div>
            </div>
          ) : (
            <div className="story-ring">
              <div className="story-ring-inner">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                     style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 cursor-text transition-all"
               style={{
                 background: expanded ? "#fff" : "var(--surface2)",
                 border: `1.5px solid ${expanded ? "var(--p300)" : "var(--border)"}`,
                 boxShadow: expanded ? "var(--glow)" : "none",
               }}
               onClick={() => setExp(true)}>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setExp(true); }}
              onFocus={() => setExp(true)}
              placeholder={`What's on your mind, ${user?.username?.split("_")[0] ?? "friend"}?`}
              rows={expanded ? 3 : 1}
              className="w-full resize-none text-sm outline-none leading-relaxed bg-transparent"
              style={{ color: "var(--tx-h)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            {!expanded && (
              <button onClick={handleSubmit} disabled={loading || !content.trim()}
                      className="btn-primary shrink-0 px-5 py-1.5 text-sm">
                Post
              </button>
            )}
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((f, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(f)} alt=""
                       className="w-20 h-20 object-cover"
                       style={{ borderRadius: "var(--r-sm)" }} />
                  <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "var(--danger)" }}>
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div className="flex items-center justify-between mt-3 pt-3"
                 style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1">
                <label className="flex items-center gap-1 px-3 py-1.5 rounded-xl cursor-pointer text-xs font-semibold transition-colors"
                       style={{ color: "var(--p500)" }}
                       onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                       onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Image className="w-4 h-4" />
                  Photo
                  <input type="file" multiple accept="image/*" className="sr-only" onChange={handleImagePick} />
                </label>

                <select value={type} onChange={(e) => setType(e.target.value)}
                        className="input-base text-xs px-3 py-1.5 cursor-pointer"
                        style={{ borderRadius: "var(--r)" }}>
                  <option value="general">General</option>
                  <option value="announcement">Announcement</option>
                  <option value="achievement">Achievement</option>
                  <option value="opportunity">Opportunity</option>
                </select>
              </div>

              <button onClick={handleSubmit} disabled={loading || !content.trim()}
                      className="btn-primary px-5 py-2 text-sm flex items-center gap-1.5"
                      style={{ opacity: !content.trim() ? 0.5 : 1 }}>
                <Sparkles className="w-3.5 h-3.5" />
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CreatePostBox;
