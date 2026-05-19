// client/src/components/feed/CreatePostBox.jsx
import { useState }     from "react";
import { Image, X }     from "lucide-react";
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
      form.append("type",    type);
      images.forEach((f) => form.append("images", f));

      const { data } = await postApi.createPost(form);
      dispatch(prependPost(data.data));
      setContent("");
      setImages([]);
      setType("general");
      setExp(false);
      toast.success("Post shared!");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center
                        justify-center text-indigo-600 font-semibold shrink-0">
          {user?.username?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setExp(true); }}
            onFocus={() => setExp(true)}
            placeholder="Share something with your community..."
            rows={expanded ? 4 : 2}
            className="w-full resize-none text-sm text-gray-800 placeholder-gray-400
                       outline-none border-none leading-relaxed"
          />

          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((f, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(f)} alt=""
                       className="w-20 h-20 object-cover rounded-lg" />
                  <button
                    onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500
                               rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div className="flex items-center justify-between mt-3 pt-3
                            border-t border-gray-100">
              <div className="flex items-center gap-3">
                {/* Image upload */}
                <label className="cursor-pointer text-gray-400 hover:text-indigo-500 transition">
                  <Image className="w-5 h-5" />
                  <input type="file" multiple accept="image/*"
                         className="sr-only" onChange={handleImagePick} />
                </label>
                {/* Post type */}
                <select value={type} onChange={(e) => setType(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg
                                   px-2 py-1 text-gray-600 outline-none">
                  <option value="general">General</option>
                  <option value="announcement">Announcement</option>
                  <option value="achievement">Achievement</option>
                  <option value="opportunity">Opportunity</option>
                </select>
              </div>

              <button onClick={handleSubmit} disabled={loading || !content.trim()}
                      className="px-5 py-1.5 bg-indigo-600 text-white rounded-xl
                                 text-sm font-medium hover:bg-indigo-700 transition
                                 disabled:opacity-50 disabled:cursor-not-allowed">
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