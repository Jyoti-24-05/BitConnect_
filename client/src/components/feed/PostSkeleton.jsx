// client/src/components/feed/PostSkeleton.jsx
const PostSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      <div className="space-y-1.5">
        <div className="w-28 h-3 bg-gray-200 rounded" />
        <div className="w-20 h-2.5 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="w-full h-3 bg-gray-200 rounded" />
      <div className="w-4/5 h-3 bg-gray-200 rounded" />
      <div className="w-3/5 h-3 bg-gray-100 rounded" />
    </div>
    <div className="flex gap-4 pt-3 border-t border-gray-100">
      <div className="w-12 h-3 bg-gray-200 rounded" />
      <div className="w-12 h-3 bg-gray-200 rounded" />
    </div>
  </div>
);
export default PostSkeleton;