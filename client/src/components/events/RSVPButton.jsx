// client/src/components/events/RSVPButton.jsx
import { useState }           from "react";
import { useDispatch }        from "react-redux";
import { updateRsvpCount }    from "@/store/slices/eventSlice";
import { eventApi }           from "@/api/eventApi";
import Button                 from "@/components/common/Button";
import toast                  from "react-hot-toast";
import cn                     from "@/utils/cn";

const RSVPButton = ({ eventId, isSoldOut, initialStatus }) => {
  const dispatch              = useDispatch();
  const [status,  setStatus]  = useState(initialStatus ?? null);
  const [loading, setLoading] = useState(false);

  const isGoing       = status === "going";
  const isInterested  = status === "interested";

  const handleRsvp = async (newStatus) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await eventApi.rsvpToEvent(eventId, { status: newStatus });
      const result   = data.data;

      // Toggle off if same status clicked again
      setStatus(result.action === "removed" ? null : newStatus);

      dispatch(updateRsvpCount({
        eventId,
        rsvpCount:      result.rsvpCount,
        spotsRemaining: result.spotsRemaining,
      }));

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
      <Button
        variant={isGoing ? "primary" : "outline"}
        size="sm"
        loading={loading}
        disabled={isSoldOut && !isGoing}
        onClick={() => handleRsvp("going")}
        className="flex-1"
      >
        {isGoing ? "✓ Going" : isSoldOut ? "Sold out" : "Going"}
      </Button>

      <Button
        variant={isInterested ? "secondary" : "ghost"}
        size="sm"
        disabled={loading}
        onClick={() => handleRsvp("interested")}
        className={cn("flex-1", isInterested && "ring-1 ring-gray-300")}
      >
        {isInterested ? "✓ Interested" : "Interested"}
      </Button>
    </div>
  );
};
export default RSVPButton;