// client/src/components/feed/PostSkeleton.jsx
const PostSkeleton = () => (
  <div className="card rounded-2xl p-5" style={{ background: "var(--card)" }}>
    <div className="flex items-center gap-3 mb-4">
      <div className="skeleton w-11 h-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-28 rounded-full" />
        <div className="skeleton h-2.5 w-20 rounded-full" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="skeleton h-3 w-full rounded-full" />
      <div className="skeleton h-3 w-5/6 rounded-full" />
      <div className="skeleton h-3 w-4/6 rounded-full" />
    </div>
    <div className="skeleton h-44 w-full mb-4" style={{ borderRadius: "var(--r)" }} />
    <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="skeleton h-8 w-16 rounded-xl" />
      <div className="skeleton h-8 w-16 rounded-xl" />
      <div className="skeleton h-8 w-16 rounded-xl" />
    </div>
  </div>
);
export default PostSkeleton;
