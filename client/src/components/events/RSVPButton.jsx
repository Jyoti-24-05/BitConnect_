// client/src/components/events/RSVPButton.jsx
import { useState }        from "react";
import { useDispatch }     from "react-redux";
import { updateRsvpCount } from "@/store/slices/eventSlice";
import { eventApi }        from "@/api/eventApi";
import toast               from "react-hot-toast";
import cn                  from "@/utils/cn";

const RSVPButton = ({ eventId, isSoldOut, initialStatus }) => {
  const dispatch              = useDispatch();
  const [status,  setStatus]  = useState(initialStatus ?? null);
  const [loading, setLoading] = useState(false);

  const isGoing      = status === "going";
  const isInterested = status === "interested";

  const handleRsvp = async (newStatus) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await eventApi.rsvpToEvent(eventId, { status: newStatus });
      const result   = data.data;
      setStatus(result.action === "removed" ? null : newStatus);
      dispatch(updateRsvpCount({ eventId, rsvpCount: result.rsvpCount, spotsRemaining: result.spotsRemaining }));
      const messages = {
        added:   newStatus === "going" ? "You're going! 🎉" : "Marked as interested",
        removed: "RSVP removed",
        updated: "RSVP updated",
      };
      toast.success(messages[result.action]);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "RSVP failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleRsvp("going")}
        disabled={(isSoldOut && !isGoing) || loading}
        className="flex-1 py-2 text-xs font-semibold transition-all"
        style={{
          borderRadius: "var(--r)",
          background: isGoing ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "transparent",
          color: isGoing ? "#fff" : "var(--p500)",
          border: `1.5px solid ${isGoing ? "transparent" : "var(--p300)"}`,
          boxShadow: isGoing ? "0 2px 10px rgba(124,58,237,0.3)" : "none",
          opacity: (isSoldOut && !isGoing) ? 0.5 : 1,
          cursor: (isSoldOut && !isGoing) ? "not-allowed" : "pointer",
        }}>
        {loading ? "..." : isGoing ? "✓ Going" : isSoldOut ? "Sold out" : "Going"}
      </button>
      <button
        onClick={() => handleRsvp("interested")}
        disabled={loading}
        className="flex-1 py-2 text-xs font-semibold transition-all"
        style={{
          borderRadius: "var(--r)",
          background: isInterested ? "var(--p100)" : "transparent",
          color: isInterested ? "var(--p600)" : "var(--tx-muted)",
          border: `1.5px solid ${isInterested ? "var(--p300)" : "var(--border)"}`,
        }}>
        {isInterested ? "✓ Interested" : "Interested"}
      </button>
    </div>
  );
};
export default RSVPButton;
