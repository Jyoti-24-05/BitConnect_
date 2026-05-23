// client/src/components/clubs/ClubSkeleton.jsx
const ClubSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100
                  overflow-hidden animate-pulse">
    <div className="h-16 bg-gray-100" />
    <div className="pt-8 px-4 pb-4 space-y-3">
      <div className="w-3/4 h-4 bg-gray-200 rounded" />
      <div className="flex gap-2">
        <div className="w-16 h-4 bg-gray-100 rounded-full" />
        <div className="w-20 h-4 bg-gray-100 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="w-full h-3 bg-gray-100 rounded" />
        <div className="w-4/5 h-3 bg-gray-100 rounded" />
      </div>
      <div className="w-full h-8 bg-gray-200 rounded-xl" />
    </div>
  </div>
);
export default ClubSkeleton;