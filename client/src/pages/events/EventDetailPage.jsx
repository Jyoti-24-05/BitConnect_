// client/src/pages/events/EventDetailPage.jsx
import { useState, useEffect }              from "react";
import { useParams, useNavigate, Link }     from "react-router-dom";
import { useDispatch }                      from "react-redux";
import {
  ArrowLeft, Calendar, Clock, MapPin,
  Wifi, Users, Share2, Trash2,
  Edit, CheckCircle, ExternalLink,
}                                           from "lucide-react";
import { eventApi }                         from "@/api/eventApi";
import { removeEvent, updateRsvpCount }     from "@/store/slices/eventSlice";
import useAuth                              from "@/hooks/useAuth";
import useSocket                            from "@/hooks/useSocket";
import Avatar                              from "@/components/common/Avatar";
import { PageSpinner }                     from "@/components/common/Spinner";
import EmptyState                          from "@/components/common/EmptyState";
import RSVPButton                          from "@/components/events/RSVPButton";
import { formatEventDate, formatDateTime } from "@/utils/formatDate";
import { SOCKET_EVENTS }                   from "@/utils/constants";
import cn                                  from "@/utils/cn";
import toast                               from "react-hot-toast";

const CATEGORY_COLORS = {
  workshop:   "bg-blue-50 text-blue-700",
  seminar:    "bg-purple-50 text-purple-700",
  hackathon:  "bg-orange-50 text-orange-700",
  cultural:   "bg-pink-50 text-pink-700",
  sports:     "bg-green-50 text-green-700",
  networking: "bg-teal-50 text-teal-700",
  other:      "bg-gray-100 text-gray-600",
};

const EventDetailPage = () => {
  const { eventId }           = useParams();
  const navigate              = useNavigate();
  const dispatch              = useDispatch();
  const { user, isAdmin }     = useAuth();
  const { socket,
          joinEventRoom,
          leaveEventRoom }    = useSocket();

  const [event,    setEvent]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [myStatus, setMyStatus] = useState(null); // "going" | "interested" | null

  // ── Fetch event ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await eventApi.getEvent(eventId);
        const ev       = data.data;
        setEvent(ev);

        // Find user's current RSVP status
        const myRsvp = ev.rsvps?.find(
          (r) => r.user === user?._id || r.user?._id === user?._id
        );
        setMyStatus(myRsvp?.status ?? null);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error("Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [eventId, user?._id]);

  // ── Join Socket.io event room for live RSVP count ───────────────────────────
  useEffect(() => {
    if (!event) return;
    joinEventRoom(eventId);

    const handleRsvpUpdate = ({ rsvpCount, spotsRemaining, userId, action }) => {
      setEvent((prev) => ({ ...prev, rsvpCount, spotsRemaining }));
      dispatch(updateRsvpCount({ eventId, rsvpCount, spotsRemaining }));

      // If current user's RSVP changed
      if (userId === user?._id) {
        setMyStatus(action === "removed" ? null : "going");
      }
    };

    socket?.on(SOCKET_EVENTS.RSVP_UPDATED, handleRsvpUpdate);

    return () => {
      leaveEventRoom(eventId);
      socket?.off(SOCKET_EVENTS.RSVP_UPDATED, handleRsvpUpdate);
    };
  }, [event, socket, eventId, joinEventRoom, leaveEventRoom, dispatch, user]);

  // ── Delete event ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await eventApi.deleteEvent(eventId);
      dispatch(removeEvent(eventId));
      toast.success("Event deleted");
      navigate("/events", { replace: true });
    } catch {
      toast.error("Failed to delete event");
    }
  };

  // ── Share ────────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied!");
      }
    } catch { /* ignore */ }
  };

  if (loading)  return <PageSpinner />;
  if (notFound) {
    return (
      <EmptyState
        icon={Calendar}
        title="Event not found"
        description="This event may have been cancelled or removed."
        action={
          <button
            onClick={() => navigate("/events")}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl
                       text-sm font-medium hover:bg-indigo-700 transition"
          >
            Browse events
          </button>
        }
      />
    );
  }
  if (!event) return null;

  const isOrganizer    = event.organizer?._id === user?._id;
  const canManage      = isOrganizer || isAdmin;
  const isUpcoming     = new Date(event.startDate) > new Date();
  const isCancelled    = event.status === "cancelled";
  const capacityPct    = event.capacity
    ? Math.round(((event.rsvpCount ?? 0) / event.capacity) * 100)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500
                   hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to events
      </button>

      {/* ── Main card ── */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm overflow-hidden">

        {/* Banner */}
        {event.banner?.url ? (
          <img
            src={event.banner.url}
            alt={event.title}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br
                          from-indigo-100 to-purple-100
                          flex items-center justify-center">
            <Calendar className="w-16 h-16 text-indigo-300" />
          </div>
        )}

        <div className="p-6">

          {/* Status + badges row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
              CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.other
            )}>
              {event.category}
            </span>

            {event.isFeatured && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full
                               bg-amber-50 text-amber-700">
                 Featured
              </span>
            )}

            {isCancelled && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full
                               bg-red-50 text-red-600">
                Cancelled
              </span>
            )}

            {event.venue?.isOnline && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full
                               bg-green-50 text-green-700 flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Online
              </span>
            )}

            {/* Manage buttons */}
            {canManage && (
              <div className="ml-auto flex items-center gap-2">
                <Link
                  to={`/events/${eventId}/edit`}
                  className="flex items-center gap-1.5 text-xs text-gray-500
                             hover:text-indigo-600 transition px-3 py-1.5
                             border border-gray-200 rounded-lg"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-xs text-red-500
                             hover:text-red-700 transition px-3 py-1.5
                             border border-red-100 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-5">
            {event.title}
          </h1>

          {/* Meta info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatEventDate(event.startDate)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDateTime(event.startDate)} – {formatDateTime(event.endDate)}
                  {event.durationMinutes && (
                    <span className="ml-2 text-indigo-500">
                      ({Math.floor(event.durationMinutes / 60)}h
                      {event.durationMinutes % 60 > 0 &&
                        ` ${event.durationMinutes % 60}m`})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {event.venue?.isOnline ? (
              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Online event</p>
                  {myStatus === "going" && event.venue.meetingLink && (
                    <a
                      href={event.venue.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline
                                 flex items-center gap-1 mt-0.5"
                    >
                      Join meeting <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {myStatus !== "going" && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      RSVP to get the meeting link
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {event.venue?.name ?? "Venue TBD"}
                  </p>
                  {event.venue?.address && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.venue.address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Capacity bar */}
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{event.rsvpCount ?? 0}</span>
                  {event.capacity && (
                    <span className="text-gray-500">
                      {" "}/ {event.capacity} going
                    </span>
                  )}
                  {!event.capacity && " going"}
                </p>
                {capacityPct !== null && (
                  <>
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full
                                    overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          capacityPct >= 90 ? "bg-red-400" :
                          capacityPct >= 70 ? "bg-amber-400" : "bg-indigo-400"
                        )}
                        style={{ width: `${Math.min(capacityPct, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {event.spotsRemaining > 0
                        ? `${event.spotsRemaining} spots remaining`
                        : "Event is full"}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* RSVP deadline */}
            {event.rsvpDeadline && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm text-gray-700">
                  RSVP by{" "}
                  <span className="font-medium">
                    {formatDateTime(event.rsvpDeadline)}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* RSVP buttons */}
          {isUpcoming && !isCancelled && (
            <RSVPButton
              eventId={eventId}
              isSoldOut={event.isSoldOut}
              initialStatus={myStatus}
              capacity={event.capacity}
            />
          )}

          {isCancelled && (
            <div className="bg-red-50 border border-red-100 rounded-xl
                            p-4 text-sm text-red-700 text-center">
              This event has been cancelled
            </div>
          )}

          {/* Share button */}
          <button
            onClick={handleShare}
            className="mt-3 w-full flex items-center justify-center gap-2
                       py-2.5 border border-gray-200 rounded-xl text-sm
                       text-gray-500 hover:bg-gray-50 transition"
          >
            <Share2 className="w-4 h-4" />
            Share event
          </button>
        </div>
      </div>

      {/* ── Description card ── */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">About this event</h2>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {event.description}
        </p>

        {/* Tags */}
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-indigo-600 bg-indigo-50
                           px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Organizer card ── */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Organizer</h2>
        <Link
          to={`/profile/${event.organizer?.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar
            src={event.organizer?.profilePicture}
            name={event.organizer?.username}
            size="md"
          />
          <div>
            <p className="font-medium text-sm text-gray-900
                          group-hover:text-indigo-600 transition">
              {event.organizer?.username}
              {event.organizer?.isVerified && (
                <span className="ml-1 text-indigo-500 text-xs">✓</span>
              )}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {event.organizer?.role}
            </p>
          </div>
        </Link>

        {/* Club link */}
        {event.club && (
          <Link
            to={`/clubs/${event.club.slug}`}
            className="mt-4 flex items-center gap-3 pt-4 border-t
                       border-gray-100 group"
          >
            {event.club.logo?.url ? (
              <img
                src={event.club.logo.url}
                alt={event.club.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-100
                              flex items-center justify-center
                              text-indigo-600 font-semibold text-sm">
                {event.club.name?.[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900
                            group-hover:text-indigo-600 transition">
                {event.club.name}
              </p>
              <p className="text-xs text-gray-400">Organising club</p>
            </div>
          </Link>
        )}
      </div>

      {/* ── Attendees card ── */}
      {event.rsvps?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100
                        shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Attendees ({event.rsvps.filter((r) => r.status === "going").length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {event.rsvps
              .filter((r) => r.status === "going")
              .slice(0, 20)
              .map((rsvp, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-indigo-100
                             flex items-center justify-center
                             text-indigo-600 text-xs font-semibold
                             border-2 border-white"
                  title={rsvp.user?.username}
                >
                  {rsvp.user?.username?.[0]?.toUpperCase() ?? "?"}
                </div>
              ))}
            {event.rsvps.filter((r) => r.status === "going").length > 20 && (
              <div className="w-9 h-9 rounded-full bg-gray-100
                              flex items-center justify-center
                              text-gray-500 text-xs font-semibold">
                +{event.rsvps.filter((r) => r.status === "going").length - 20}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default EventDetailPage;