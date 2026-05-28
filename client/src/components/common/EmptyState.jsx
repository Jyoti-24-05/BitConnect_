// client/src/components/common/EmptyState.jsx
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="card rounded-2xl text-center py-16 px-8" style={{ background: "var(--card)" }}>
    {Icon && (
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
           style={{ background: "linear-gradient(135deg, var(--p100), var(--p200))" }}>
        <Icon className="w-8 h-8" style={{ color: "var(--p400)" }} />
      </div>
    )}
    <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>{title}</h3>
    {description && <p className="text-sm mb-6" style={{ color: "var(--tx-muted)" }}>{description}</p>}
    {action}
  </div>
);
export default EmptyState;
