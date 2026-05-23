// client/src/pages/events/EventsPage.jsx
import { useState, useEffect,
         useCallback }              from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link }                     from "react-router-dom";
import {
  Search, X, Plus, Calendar,
  Wifi, LayoutGrid, List,
}                                   from "lucide-react";
import { eventApi }                 from "@/api/eventApi";
import { setEvents, appendEvents }  from "@/store/slices/eventSlice";
import useAuth                      from "@/hooks/useAuth";
import useDebounce                  from "@/hooks/useDebounce";
import useInfiniteScroll            from "@/hooks/useInfiniteScroll";
import EventCard                    from "@/components/events/EventCard";
import EventSkeleton                from "@/components/events/EventSkeleton";
import EmptyState                   from "@/components/common/EmptyState";
import cn                           from "@/utils/cn";
import toast                        from "react-hot-toast";

const CATEGORIES = [
  { value: "",           label: "All"        },
  { value: "workshop",   label: "Workshop"   },
  { value: "hackathon",  label: "Hackathon"  },
  { value: "seminar",    label: "Seminar"    },
  { value: "cultural",   label: "Cultural"   },
  { value: "sports",     label: "Sports"     },
  { value: "networking", label: "Networking" },
  { value: "other",      label: "Other"      },
];

const EventsPage = () => {
  const dispatch              = useDispatch();
  const { isClub, isAdmin }   = useAuth();

  // ── Get events from Redux — always default to [] ───────────────────────────
  const eventsState = useSelector((s) => s.events);
  const list        = eventsState?.list    ?? [];
  const cursor      = eventsState?.cursor  ?? null;
  const hasMore     = eventsState?.hasMore ?? true;

  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [viewMode,   setViewMode]   = useState("grid");
  const [myRsvps,    setMyRsvps]    = useState([]);
  const [initialized, setInit]      = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  // ── Load events ────────────────────────────────────────────────────────────
  const loadEvents = useCallback(async (cursorVal = null) => {
    if (loading) return;
    setLoading(true);
    try {
      let result = { events: [], nextCursor: null, hasMore: false };

      if (debouncedSearch.trim()) {
        const res = await eventApi.searchEvents({
          q:     debouncedSearch,
          limit: 12,
          skip:  cursorVal ? list.length : 0,
        });
        const events = res.data?.data ?? [];
        result = {
          events,
          nextCursor: events.length === 12 ? "more" : null,
          hasMore:    events.length === 12,
        };
      } else {
        const res    = await eventApi.getEvents({
          cursor:   cursorVal ?? undefined,
          limit:    12,
          category: category || undefined,
        });
        result = res.data?.data ?? { events: [], nextCursor: null, hasMore: false };
      }

      // Ensure events is always an array
      if (!Array.isArray(result.events)) result.events = [];

      if (cursorVal) dispatch(appendEvents(result));
      else           dispatch(setEvents(result));
    } catch (err) {
      console.error("[Events] load error:", err.response?.data ?? err.message);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, list.length, loading, dispatch]);

  // Reset + reload when filters change
  useEffect(() => {
    dispatch(setEvents({ events: [], nextCursor: null, hasMore: true }));
    loadEvents(null);
    setInit(true);
  }, [debouncedSearch, category]);

  // ── My RSVPs (non-critical — failure doesn't break the page) ──────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res  = await eventApi.getMyRsvps({ status: "going" });
        const data = res.data?.data;
        if (Array.isArray(data)) {
          setMyRsvps(data.map((e) => e._id).filter(Boolean));
        }
      } catch {
        // Silently ignore — my-rsvps failing must never crash the page
        setMyRsvps([]);
      }
    };
    fetch();
  }, []);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (cursor && cursor !== "more") loadEvents(cursor);
  }, [cursor, loadEvents]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading);

  // ── Filter online-only client-side ─────────────────────────────────────────
  const displayed = Array.isArray(list)
    ? (onlineOnly ? list.filter((e) => e.venue?.isOnline) : list)
    : [];

  const canCreate = isClub || isAdmin;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upcoming events from your community
          </p>
        </div>
        {canCreate && (
          <Link
            to="/events/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600
                       text-white text-sm font-medium rounded-xl
                       hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Create event
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border
                         border-gray-200 rounded-xl text-sm outline-none
                         focus:ring-2 focus:ring-indigo-200 transition"
            />
            {search && (
              <button onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex items-center border border-gray-200
                          rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-2 transition",
                viewMode === "grid"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-400 hover:bg-gray-50")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2 border-l border-gray-200 transition",
                viewMode === "list"
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-400 hover:bg-gray-50")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium border transition",
                category === value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              )}
            >
              {label}
            </button>
          ))}

          <div className="h-4 w-px bg-gray-200 mx-1" />

          <button
            onClick={() => setOnlineOnly((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full",
              "text-xs font-medium border transition",
              onlineOnly
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
            )}
          >
            <Wifi className="w-3.5 h-3.5" />
            Online only
          </button>
        </div>

        {/* Active filters summary */}
        {(category || onlineOnly || search) && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs text-gray-400">Filtered:</span>
            {category && (
              <span className="inline-flex items-center gap-1 text-xs
                               bg-indigo-50 text-indigo-700 px-2.5 py-1
                               rounded-full">
                {category}
                <button onClick={() => setCategory("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onlineOnly && (
              <span className="inline-flex items-center gap-1 text-xs
                               bg-green-50 text-green-700 px-2.5 py-1
                               rounded-full">
                Online only
                <button onClick={() => setOnlineOnly(false)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 text-xs
                               bg-gray-100 text-gray-700 px-2.5 py-1
                               rounded-full">
                "{search}"
                <button onClick={() => setSearch("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => { setCategory(""); setOnlineOnly(false); setSearch(""); }}
              className="text-xs text-red-500 hover:underline ml-auto"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* My RSVPs strip */}
      {myRsvps.length > 0 && !search && !category && !onlineOnly && (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
          <p className="text-sm font-medium text-indigo-800 mb-3">
            Your upcoming events
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {list
              .filter((e) => e?._id && myRsvps.includes(e._id))
              .slice(0, 4)
              .map((event) => (
                <Link
                  key={event._id}
                  to={`/events/${event._id}`}
                  className="shrink-0 bg-white rounded-xl border
                             border-indigo-100 px-3 py-2 text-xs
                             text-indigo-900 hover:border-indigo-300
                             transition max-w-[160px]"
                >
                  <p className="font-medium line-clamp-1">{event.title}</p>
                  <p className="text-indigo-500 mt-0.5">
                    {new Date(event.startDate).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short",
                    })}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Event grid / list */}
      {displayed.length === 0 && !loading ? (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description={
            search || category || onlineOnly
              ? "Try adjusting your filters"
              : "No upcoming events yet"
          }
          action={
            canCreate && !search && (
              <Link to="/events/create"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl
                               text-sm font-medium hover:bg-indigo-700 transition">
                Create the first event
              </Link>
            )
          }
        />
      ) : (
        <div className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
            : "flex flex-col gap-4"
        )}>
          {displayed.map((event) => (
            event?._id && (
              <EventCard
                key={event._id}
                event={event}
                isRsvped={myRsvps.includes(event._id)}
                viewMode={viewMode}
              />
            )
          ))}

          {loading && Array.from({ length: 4 }).map((_, i) => (
            <EventSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {!hasMore && !loading && displayed.length > 0 && (
        <p className="text-center text-sm text-gray-400 py-6">
          All events loaded 🎉
        </p>
      )}
    </div>
  );
};

export default EventsPage;