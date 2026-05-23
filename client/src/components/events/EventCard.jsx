// client/src/components/events/EventCard.jsx
import { Link }               from "react-router-dom";
import { Calendar, MapPin,
         Users, Clock,
         Wifi }               from "lucide-react";
import { formatEventDate,
         formatDateTime }     from "@/utils/formatDate";
import RSVPButton             from "./RSVPButton";
import cn                     from "@/utils/cn";

const CATEGORY_COLORS = {
  workshop:    "bg-blue-50   text-blue-600",
  seminar:     "bg-purple-50 text-purple-600",
  hackathon:   "bg-orange-50 text-orange-600",
  cultural:    "bg-pink-50   text-pink-600",
  sports:      "bg-green-50  text-green-600",
  networking:  "bg-teal-50   text-teal-600",
  other:       "bg-gray-100  text-gray-600",
};

const EventCard = ({ event, isRsvped = false, viewMode = "grid" }) => {
  const isOnline     = event.venue?.isOnline;
  const isSoldOut    = event.isSoldOut;
  const isUpcoming   = new Date(event.startDate) > new Date();

  if (viewMode === "list") {
    return (
      <article className="bg-white rounded-2xl border border-gray-100
                          shadow-sm hover:shadow-md transition p-4
                          flex gap-4 items-start">
        {/* Thumbnail */}
        <div className="w-24 h-20 rounded-xl overflow-hidden shrink-0">
          {event.banner?.url ? (
            <img src={event.banner.url} alt=""
                 className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-indigo-50 flex
                            items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/events/${event._id}`}>
              <h3 className="font-semibold text-sm text-gray-900
                             hover:text-indigo-600 transition line-clamp-1">
                {event.title}
              </h3>
            </Link>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0",
              CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.other
            )}>
              {event.category}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {formatEventDate(event.startDate)}
            </span>
            {event.venue?.isOnline ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Wifi className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {event.venue?.name ?? "TBD"}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              {event.rsvpCount ?? 0} going
            </span>
            {isRsvped && (
              <span className="text-xs text-green-600 font-medium
                               flex items-center gap-1">
                ✓ You're going
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-2xl border border-gray-100
                        shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Banner */}
      {event.banner?.url ? (
        <img
          src={event.banner.url}
          alt={event.title}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-indigo-100
                        to-purple-100 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-indigo-300" />
        </div>
      )}

      <div className="p-5">
        {/* Category + status badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
            CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.other
          )}>
            {event.category}
          </span>

          {isSoldOut && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full
                             bg-red-50 text-red-500">
              Sold out
            </span>
          )}

          {event.isFeatured && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full
                             bg-amber-50 text-amber-600">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/events/${event._id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2
                         hover:text-indigo-600 transition">
            {event.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
          {event.description}
        </p>

        {/* Meta info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{formatEventDate(event.startDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              {formatDateTime(event.startDate)} –{" "}
              {formatDateTime(event.endDate)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-green-600">Online event</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="line-clamp-1">
                  {event.venue?.name ?? "Venue TBD"}
                </span>
              </>
            )}
          </div>

          {event.capacity && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                {event.rsvpCount ?? 0} / {event.capacity} going
                {event.spotsRemaining > 0 && (
                  <span className="text-green-600 ml-1">
                    · {event.spotsRemaining} spots left
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Organizer */}
        {event.organizer && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center
                            justify-center text-indigo-600 text-xs font-semibold">
              {event.organizer.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-gray-500">
              by{" "}
              <Link
                to={`/profile/${event.organizer.username}`}
                className="text-indigo-500 hover:underline"
              >
                {event.organizer.username}
              </Link>
            </span>
          </div>
        )}

        {/* RSVP button */}
        {isUpcoming && (
          <RSVPButton
            eventId={event._id}
            isSoldOut={isSoldOut}
            capacity={event.capacity}
          />
        )}
      </div>
    </article>
  );
};
export default EventCard;