// client/src/components/clubs/ClubSkeleton.jsx
const ClubSkeleton = () => (
  <div className="card rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
    <div className="skeleton h-20 w-full" style={{ borderRadius: "0" }} />
    <div className="pt-8 px-4 pb-4 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-32 rounded-full" />
        <div className="skeleton h-4 w-16 rounded-full" />
      </div>
      <div className="skeleton h-3 w-24 rounded-full" />
      <div className="skeleton h-3 w-full rounded-full" />
      <div className="skeleton h-3 w-4/5 rounded-full" />
      <div className="skeleton h-9 w-full rounded-xl" />
    </div>
  </div>
);
export default ClubSkeleton;
