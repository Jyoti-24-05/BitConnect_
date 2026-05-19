// client/src/components/events/EventSkeleton.jsx
const EventSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100
                  overflow-hidden animate-pulse">
    {/* Banner */}
    <div className="w-full h-40 bg-gray-200" />
    <div className="p-5 space-y-3">
      {/* Badge */}
      <div className="w-20 h-5 bg-gray-200 rounded-full" />
      {/* Title */}
      <div className="w-3/4 h-4 bg-gray-200 rounded" />
      <div className="w-1/2 h-4 bg-gray-100 rounded" />
      {/* Meta */}
      <div className="space-y-2 pt-1">
        <div className="w-40 h-3 bg-gray-200 rounded" />
        <div className="w-32 h-3 bg-gray-100 rounded" />
        <div className="w-36 h-3 bg-gray-100 rounded" />
      </div>
      {/* Button */}
      <div className="w-full h-9 bg-gray-200 rounded-xl mt-2" />
    </div>
  </div>
);
export default EventSkeleton;