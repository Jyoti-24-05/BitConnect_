// client/src/pages/events/EventsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector }         from "react-redux";
import { Link }                              from "react-router-dom";
import { Search, X, Plus, Calendar, Wifi, LayoutGrid, List, Sparkles } from "lucide-react";
import { eventApi }                          from "@/api/eventApi";
import { setEvents, appendEvents }           from "@/store/slices/eventSlice";
import useAuth                               from "@/hooks/useAuth";
import useDebounce                           from "@/hooks/useDebounce";
import useInfiniteScroll                     from "@/hooks/useInfiniteScroll";
import EventCard                             from "@/components/events/EventCard";
import EventSkeleton                         from "@/components/events/EventSkeleton";
import EmptyState                            from "@/components/common/EmptyState";
import cn                                    from "@/utils/cn";
import toast                                 from "react-hot-toast";

const CATEGORIES = [
  { value: "",           label: "All",        emoji: "✨" },
  { value: "workshop",   label: "Workshop",   emoji: "🛠" },
  { value: "hackathon",  label: "Hackathon",  emoji: "💻" },
  { value: "seminar",    label: "Seminar",    emoji: "🎓" },
  { value: "cultural",   label: "Cultural",   emoji: "🎭" },
  { value: "sports",     label: "Sports",     emoji: "⚽" },
  { value: "networking", label: "Networking", emoji: "🤝" },
  { value: "other",      label: "Other",      emoji: "📌" },
];

const EventsPage = () => {
  const dispatch            = useDispatch();
  const { isClub, isAdmin } = useAuth();
  const eventsState         = useSelector((s) => s.events);
  const list                = eventsState?.list    ?? [];
  const cursor              = eventsState?.cursor  ?? null;
  const hasMore             = eventsState?.hasMore ?? true;

  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [viewMode,   setViewMode]   = useState("grid");
  const [myRsvps,    setMyRsvps]    = useState([]);

  const debouncedSearch = useDebounce(search, 400);

  const loadEvents = useCallback(async (cursorVal = null) => {
    if (loading) return;
    setLoading(true);
    try {
      let result = { events: [], nextCursor: null, hasMore: false };
      if (debouncedSearch.trim()) {
        const res = await eventApi.searchEvents({ q: debouncedSearch, limit: 12, skip: cursorVal ? list.length : 0 });
        const events = res.data?.data ?? [];
        result = { events, nextCursor: events.length === 12 ? "more" : null, hasMore: events.length === 12 };
      } else {
        const res = await eventApi.getEvents({ cursor: cursorVal ?? undefined, limit: 12, category: category || undefined });
        result = res.data?.data ?? { events: [], nextCursor: null, hasMore: false };
      }
      if (!Array.isArray(result.events)) result.events = [];
      if (cursorVal) dispatch(appendEvents(result));
      else           dispatch(setEvents(result));
    } catch (err) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, list.length, loading, dispatch]);

  useEffect(() => {
    dispatch(setEvents({ events: [], nextCursor: null, hasMore: true }));
    loadEvents(null);
  }, [debouncedSearch, category]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await eventApi.getMyRsvps({ status: "going" });
        const data = res.data?.data;
        if (Array.isArray(data)) setMyRsvps(data.map((e) => e._id).filter(Boolean));
      } catch { setMyRsvps([]); }
    };
    fetch();
  }, []);

  const loadMore    = useCallback(() => { if (cursor && cursor !== "more") loadEvents(cursor); }, [cursor, loadEvents]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading);
  const displayed   = Array.isArray(list) ? (onlineOnly ? list.filter((e) => e.venue?.isOnline) : list) : [];
  const canCreate   = isClub || isAdmin;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>Events</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--tx-muted)" }}>Upcoming from your community</p>
        </div>
        {canCreate && (
          <Link to="/events/create" className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
            <Plus className="w-4 h-4" />
            Create Event
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <div className="card rounded-2xl p-4 space-y-3" style={{ background: "var(--card)" }}>
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--p400)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
                   placeholder="Search events..."
                   className="input-base w-full pl-10 pr-10 py-2.5 text-sm"
                   style={{ borderRadius: "99px" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--tx-muted)" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center overflow-hidden shrink-0"
               style={{ border: "1.5px solid var(--border)", borderRadius: "var(--r)" }}>
            {[{ m: "grid", Icon: LayoutGrid }, { m: "list", Icon: List }].map(({ m, Icon }) => (
              <button key={m} onClick={() => setViewMode(m)}
                      className="p-2.5 transition-colors"
                      style={{
                        background: viewMode === m ? "var(--p100)" : "transparent",
                        color: viewMode === m ? "var(--p600)" : "var(--tx-muted)",
                        borderRight: m === "grid" ? "1.5px solid var(--border)" : "none",
                      }}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(({ value, label, emoji }) => (
            <button key={value} onClick={() => setCategory(value)}
                    className="px-3.5 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      borderRadius: "99px",
                      background: category === value ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "var(--surface2)",
                      color: category === value ? "#fff" : "var(--tx)",
                      border: `1.5px solid ${category === value ? "transparent" : "var(--border)"}`,
                      boxShadow: category === value ? "0 2px 10px rgba(124,58,237,0.25)" : "none",
                    }}>
              {emoji} {label}
            </button>
          ))}

          <div className="h-4 w-px mx-1" style={{ background: "var(--border)" }} />

          <button onClick={() => setOnlineOnly((p) => !p)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    borderRadius: "99px",
                    background: onlineOnly ? "linear-gradient(135deg, #10b981, #34d399)" : "var(--surface2)",
                    color: onlineOnly ? "#fff" : "var(--tx)",
                    border: `1.5px solid ${onlineOnly ? "transparent" : "var(--border)"}`,
                    boxShadow: onlineOnly ? "0 2px 10px rgba(16,185,129,0.25)" : "none",
                  }}>
            <Wifi className="w-3.5 h-3.5" /> Online only
          </button>
        </div>

        {(category || onlineOnly || search) && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs" style={{ color: "var(--tx-muted)" }}>Active filters:</span>
            {[
              category && { label: category, onRemove: () => setCategory("") },
              onlineOnly && { label: "Online only", onRemove: () => setOnlineOnly(false) },
              search && { label: `"${search}"`, onRemove: () => setSearch("") },
            ].filter(Boolean).map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "var(--p100)", color: "var(--p600)" }}>
                {f.label}
                <button onClick={f.onRemove}><X className="w-3 h-3" /></button>
              </span>
            ))}
            <button onClick={() => { setCategory(""); setOnlineOnly(false); setSearch(""); }}
                    className="text-xs font-semibold ml-auto hover:underline"
                    style={{ color: "var(--danger)" }}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* My RSVPs strip */}
      {myRsvps.length > 0 && !search && !category && !onlineOnly && (
        <div className="card rounded-2xl p-4" style={{ background: "linear-gradient(135deg, var(--p50), var(--p100))", border: "1.5px solid var(--p200)" }}>
          <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--p700)", fontFamily: "Syne, sans-serif" }}>
            <Sparkles className="w-4 h-4" /> Your upcoming events
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {list.filter((e) => e?._id && myRsvps.includes(e._id)).slice(0, 4).map((event) => (
              <Link key={event._id} to={`/events/${event._id}`}
                    className="shrink-0 px-3 py-2.5 text-xs transition-all max-w-[160px] hover:scale-[1.02]"
                    style={{ background: "#fff", borderRadius: "var(--r)", border: "1.5px solid var(--p200)", color: "var(--tx-h)" }}>
                <p className="font-semibold line-clamp-1">{event.title}</p>
                <p className="mt-0.5" style={{ color: "var(--p500)" }}>
                  {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Event grid */}
      {displayed.length === 0 && !loading ? (
        <EmptyState icon={Calendar} title="No events found"
          description={search || category || onlineOnly ? "Try adjusting your filters" : "No upcoming events yet"}
          action={canCreate && !search && (
            <Link to="/events/create" className="btn-primary px-5 py-2 text-sm">
              Create the first event
            </Link>
          )} />
      ) : (
        <div className={cn(viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "flex flex-col gap-4")}>
          {displayed.map((event) => event?._id && (
            <EventCard key={event._id} event={event} isRsvped={myRsvps.includes(event._id)} viewMode={viewMode} />
          ))}
          {loading && Array.from({ length: 4 }).map((_, i) => <EventSkeleton key={i} />)}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {!hasMore && !loading && displayed.length > 0 && (
        <p className="text-center text-sm py-6" style={{ color: "var(--tx-light)" }}>
          All events loaded ✨
        </p>
      )}
    </div>
  );
};
export default EventsPage;
