// client/src/components/events/EventCard.jsx
import { Link }               from "react-router-dom";
import { Calendar, MapPin, Users, Clock, Wifi } from "lucide-react";
import { formatEventDate, formatDateTime } from "@/utils/formatDate";
import RSVPButton             from "./RSVPButton";
import cn                     from "@/utils/cn";

const CATEGORY_STYLES = {
  workshop:   { cls: "badge-blue",   emoji: "🛠" },
  seminar:    { cls: "badge-purple", emoji: "🎓" },
  hackathon:  { cls: "badge-amber",  emoji: "💻" },
  cultural:   { cls: "badge-pink",   emoji: "🎭" },
  sports:     { cls: "badge-green",  emoji: "⚽" },
  networking: { cls: "badge",        emoji: "🤝" },
  other:      { cls: "badge",        emoji: "📌" },
};

const EventCard = ({ event, isRsvped = false, viewMode = "grid" }) => {
  const isOnline   = event.venue?.isOnline;
  const isSoldOut  = event.isSoldOut;
  const isUpcoming = new Date(event.startDate) > new Date();
  const catStyle   = CATEGORY_STYLES[event.category] ?? CATEGORY_STYLES.other;

  if (viewMode === "list") {
    return (
      <article className="card card-lift rounded-2xl p-4 flex gap-4 items-start"
               style={{ background: "var(--card)" }}>
        <div className="w-24 h-20 overflow-hidden shrink-0" style={{ borderRadius: "var(--r)" }}>
          {event.banner?.url ? (
            <img src={event.banner.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl"
                 style={{ background: "linear-gradient(135deg, var(--p100), var(--p200))" }}>
              {catStyle.emoji}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <Link to={`/events/${event._id}`}>
              <h3 className="font-semibold text-sm line-clamp-1 hover:underline"
                  style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                {event.title}
              </h3>
            </Link>
            <span className={`badge ${catStyle.cls} shrink-0 capitalize`}>{event.category}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--tx-muted)" }}>
              <Calendar className="w-3.5 h-3.5" style={{ color: "var(--p400)" }} />
              {formatEventDate(event.startDate)}
            </span>
            {isOnline ? (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--success)" }}>
                <Wifi className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--tx-muted)" }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: "var(--p400)" }} />
                {event.venue?.name ?? "TBD"}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--tx-muted)" }}>
              <Users className="w-3.5 h-3.5" style={{ color: "var(--p400)" }} />
              {event.rsvpCount ?? 0} going
            </span>
            {isRsvped && (
              <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>✓ You're going</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card card-lift rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
      {/* Banner */}
      <div className="relative">
        {event.banner?.url ? (
          <img src={event.banner.url} alt={event.title} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 flex items-center justify-center text-5xl"
               style={{ background: "linear-gradient(135deg, var(--p100), var(--p200))" }}>
            {catStyle.emoji}
          </div>
        )}
        {/* Floating badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={`badge ${catStyle.cls} capitalize shadow-sm`}>{catStyle.emoji} {event.category}</span>
          {isSoldOut && <span className="badge badge-red shadow-sm">Sold out</span>}
          {event.isFeatured && <span className="badge badge-amber shadow-sm">⭐ Featured</span>}
        </div>
        {isRsvped && (
          <div className="absolute top-3 right-3">
            <span className="badge badge-green shadow-sm">✓ Going</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <Link to={`/events/${event._id}`}>
          <h3 className="font-bold mb-1.5 line-clamp-2 hover:text-purple-600 transition-colors"
              style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif", fontSize: "15px" }}>
            {event.title}
          </h3>
        </Link>

        <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--tx-muted)", lineHeight: "1.6" }}>
          {event.description}
        </p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--tx-muted)" }}>
            <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--p400)" }} />
            <span>{formatEventDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--tx-muted)" }}>
            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--p400)" }} />
            <span>{formatDateTime(event.startDate)} – {formatDateTime(event.endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: isOnline ? "var(--success)" : "var(--tx-muted)" }}>
            {isOnline ? <Wifi className="w-3.5 h-3.5 shrink-0" /> : <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--p400)" }} />}
            <span className="line-clamp-1">{isOnline ? "Online event" : (event.venue?.name ?? "Venue TBD")}</span>
          </div>
          {event.capacity && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--tx-muted)" }}>
              <Users className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--p400)" }} />
              <span>
                {event.rsvpCount ?? 0} / {event.capacity} going
                {event.spotsRemaining > 0 && (
                  <span className="font-semibold ml-1" style={{ color: "var(--success)" }}>· {event.spotsRemaining} left</span>
                )}
              </span>
            </div>
          )}
        </div>

        {event.organizer && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                 style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              {event.organizer.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs" style={{ color: "var(--tx-muted)" }}>
              by <Link to={`/profile/${event.organizer.username}`}
                       className="font-semibold hover:underline" style={{ color: "var(--p500)" }}>
                {event.organizer.username}
              </Link>
            </span>
          </div>
        )}

        {isUpcoming && (
          <RSVPButton eventId={event._id} isSoldOut={isSoldOut} capacity={event.capacity} />
        )}
      </div>
    </article>
  );
};
export default EventCard;
