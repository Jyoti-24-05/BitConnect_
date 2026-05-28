// client/src/components/events/EventSkeleton.jsx
const EventSkeleton = () => (
  <div className="card rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
    <div className="skeleton h-40 w-full" style={{ borderRadius: "0" }} />
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-4 w-3/4 rounded-full" />
      <div className="skeleton h-3 w-full rounded-full" />
      <div className="skeleton h-3 w-5/6 rounded-full" />
      <div className="space-y-2">
        <div className="skeleton h-3 w-40 rounded-full" />
        <div className="skeleton h-3 w-36 rounded-full" />
      </div>
      <div className="skeleton h-9 w-full rounded-xl" />
    </div>
  </div>
);
export default EventSkeleton;
