// client/src/pages/clubs/ClubsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate }               from "react-router-dom";
import { Search, Users, Plus, X, ChevronRight, MessageSquare } from "lucide-react";
import { clubApi }          from "@/api/clubApi";
import useAuth              from "@/hooks/useAuth";
import useDebounce          from "@/hooks/useDebounce";
import useInfiniteScroll    from "@/hooks/useInfiniteScroll";
import ClubCard             from "@/components/clubs/ClubCard";
import ClubSkeleton         from "@/components/clubs/ClubSkeleton";
import EmptyState           from "@/components/common/EmptyState";
import { CLUB_CATEGORIES }  from "@/utils/constants";
import cn                   from "@/utils/cn";
import toast                from "react-hot-toast";

const ClubsPage = () => {
  const { user, isAdmin }     = useAuth();
  const navigate              = useNavigate();
  const [clubs,      setClubs]      = useState([]);
  const [myClubs,    setMyClubs]    = useState([]);
  const [cursor,     setCursor]     = useState(null);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [myLoading,  setMyLoading]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("");
  const [joinStatus, setJoinStatus] = useState({});
  const debouncedSearch = useDebounce(search, 400);

  // ── Load my clubs — uses dedicated /clubs/me endpoint ──────────────────────
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setMyLoading(true);
      try {
        const { data } = await clubApi.getMyClubs();
        setMyClubs(Array.isArray(data.data) ? data.data : []);
      } catch { /* non-critical */ }
      finally  { setMyLoading(false); }
    };
    fetch();
  }, [user]);

  // ── Load discover clubs ─────────────────────────────────────────────────────
  const loadClubs = useCallback(async (cursorVal = null) => {
    if (loading) return;
    setLoading(true);
    try {
      let result;
      if (debouncedSearch.trim()) {
        const { data } = await clubApi.searchClubs({ q: debouncedSearch, limit: 12, skip: cursorVal ? clubs.length : 0 });
        result = { clubs: data.data, nextCursor: data.data.length === 12 ? "more" : null, hasMore: data.data.length === 12 };
      } else {
        const { data } = await clubApi.discoverClubs({ cursor: cursorVal, limit: 12, category: category || undefined });
        result = data.data;
      }
      if (cursorVal) {
        setClubs((prev) => {
          const ids  = new Set(prev.map((c) => c._id));
          return [...prev, ...result.clubs.filter((c) => !ids.has(c._id))];
        });
      } else {
        setClubs(result.clubs ?? []);
      }
      setCursor(result.nextCursor);
      setHasMore(result.hasMore ?? false);
    } catch { toast.error("Failed to load clubs"); }
    finally  { setLoading(false); }
  }, [debouncedSearch, category, clubs.length, loading]);

  useEffect(() => { setClubs([]); setCursor(null); setHasMore(true); loadClubs(null); }, [debouncedSearch, category]);

  const loadMore    = useCallback(() => { if (cursor && cursor !== "more") loadClubs(cursor); }, [cursor, loadClubs]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading);

  const sid = (id) => id?.toString() ?? id;

  // ── Join ─────────────────────────────────────────────────────────────────────
  const handleJoin = useCallback(async (club) => {
    const id   = sid(club._id);
    const prev = joinStatus[id];

    // Already known as member — go straight to club page
    if (prev === "joined" || myClubs.some((c) => sid(c._id) === id)) {
      navigate(`/clubs/${club.slug ?? club._id}`);
      return;
    }

    // Optimistic update
    setJoinStatus((p) => ({ ...p, [id]: club.isPrivate ? "pending" : "joined" }));
    try {
      const { data } = await clubApi.joinClub(id);
      const status   = data.data?.status ?? (club.isPrivate ? "pending" : "joined");
      setJoinStatus((p) => ({ ...p, [id]: status }));
      if (status === "joined") {
        toast.success(`Welcome to ${club.name}! 🎉`);
        setMyClubs((p) => [...p, { ...club, _id: id }]);
        navigate(`/clubs/${club.slug ?? club._id}`);
      } else {
        toast.success("Join request sent! ⏳");
      }
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message ?? "";

      // Any 409 = already involved with this club → navigate there silently
      if (status === 409) {
        if (msg.toLowerCase().includes("pending")) {
          setJoinStatus((p) => ({ ...p, [id]: "pending" }));
          toast("Your join request is still pending ⏳");
          return;
        }
        // "already a member" or any other 409 → treat as joined, go to club page
        setJoinStatus((p) => ({ ...p, [id]: "joined" }));
        if (!myClubs.some((c) => sid(c._id) === id)) {
          setMyClubs((p) => [...p, { ...club, _id: id }]);
        }
        navigate(`/clubs/${club.slug ?? club._id}`);
        return;
      }

      // Real error
      setJoinStatus((p) => ({ ...p, [id]: prev ?? null }));
      toast.error(msg || "Failed to join");
    }
  }, [joinStatus, myClubs, navigate]);

  const handleLeave = useCallback(async (club) => {
    const id = sid(club._id);
    if (!window.confirm(`Leave ${club.name}?`)) return;
    try {
      await clubApi.leaveClub(id);
      setJoinStatus((p) => ({ ...p, [id]: null }));
      setMyClubs((p) => p.filter((c) => sid(c._id) !== id));
      toast.success(`Left ${club.name}`);
    } catch (err) { toast.error(err.response?.data?.message ?? "Failed to leave"); }
  }, []);

  const getStatus = (club) => {
    const id = sid(club._id);
    if (joinStatus[id] !== undefined) return joinStatus[id];
    return myClubs.some((c) => sid(c._id) === id) ? "joined" : null;
  };

  const CATEGORY_OPTIONS = [
    { value: "", label: "All" },
    ...CLUB_CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>Clubs</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--tx-muted)" }}>Discover and join student organisations</p>
        </div>
        <Link to="/clubs/create" className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
          <Plus className="w-4 h-4" /> Create club
        </Link>
      </div>

      {/* Search + filters */}
      <div className="card rounded-2xl p-4 space-y-3" style={{ background: "var(--card)" }}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--p400)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search clubs..."
                 className="input-base w-full pl-10 pr-10 py-2.5 text-sm"
                 style={{ borderRadius: "99px" }} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--tx-muted)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setCategory(value)}
                    className="px-3.5 py-1.5 text-xs font-semibold transition-all capitalize"
                    style={{
                      borderRadius: "99px",
                      background: category === value ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "var(--surface2)",
                      color: category === value ? "#fff" : "var(--tx)",
                      border: `1.5px solid ${category === value ? "transparent" : "var(--border)"}`,
                      boxShadow: category === value ? "0 2px 10px rgba(124,58,237,0.25)" : "none",
                    }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* My clubs */}
      {myClubs.length > 0 && !search && !category && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--tx-muted)" }}>
            My clubs ({myClubs.length})
          </h2>
          <div className="space-y-2">
            {myClubs.map((club) => (
              <MyClubRow key={club._id} club={club} userId={user?._id} onLeave={handleLeave} />
            ))}
          </div>
        </div>
      )}

      {/* Discover */}
      <div>
        {(search || category || myClubs.length > 0) && (
          <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--tx-muted)" }}>
            {search ? `Results for "${search}"` : category ? `${category} clubs` : "Discover"}
          </h2>
        )}

        {clubs.length === 0 && !loading ? (
          <EmptyState icon={Users} title="No clubs found"
            description={search || category ? "Try a different search or category" : "No clubs yet — be the first to create one!"}
            action={!search && (
              <Link to="/clubs/create" className="btn-primary px-5 py-2 text-sm">Create a club</Link>
            )} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clubs
              .filter((c) => !myClubs.some((m) => sid(m._id) === sid(c._id)))
              .map((club) => (
                <ClubCard key={sid(club._id)} club={{ ...club, _id: sid(club._id) }}
                          status={getStatus(club)} onJoin={handleJoin} onLeave={handleLeave} />
              ))}
            {loading && Array.from({ length: 4 }).map((_, i) => <ClubSkeleton key={i} />)}
          </div>
        )}
      </div>

      <div ref={sentinelRef} className="h-4" />
      {!hasMore && !loading && clubs.length > 0 && (
        <p className="text-center text-sm py-4" style={{ color: "var(--tx-light)" }}>All clubs loaded ✨</p>
      )}
    </div>
  );
};

// ── My Club Row — click → go to club page ──────────────────────────────────────
const MyClubRow = ({ club, userId, onLeave }) => {
  const myMember  = club.members?.find((m) => (m.user?._id ?? m.user) === userId);
  const role      = myMember?.role ?? "member";
  const isClubAdmin = club.admin?._id === userId || club.admin === userId;
  const slug      = club.slug ?? club._id;

  return (
    <Link to={`/clubs/${slug}`}
          className="flex items-center gap-3 p-3 rounded-2xl transition-all group"
          style={{ background: "var(--card)", border: "1.5px solid var(--border)", textDecoration: "none" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--p300)"; e.currentTarget.style.background = "var(--p50)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--card)"; }}>
      <ClubLogo club={club} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate flex items-center gap-1"
           style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
          {club.name}
          {club.isVerified && <span className="text-xs" style={{ color: "var(--p500)" }}>✓</span>}
        </p>
        <p className="text-xs capitalize truncate" style={{ color: "var(--tx-muted)" }}>
          {club.category} · {club.memberCount ?? 0} members
        </p>
      </div>

      <span className="badge capitalize shrink-0"
            style={{
              background: isClubAdmin || role === "co-admin" ? "var(--p100)" : role === "moderator" ? "#f3e8ff" : "var(--surface2)",
              color: isClubAdmin || role === "co-admin" ? "var(--p600)" : role === "moderator" ? "#7c3aed" : "var(--tx-muted)",
            }}>
        {isClubAdmin ? "admin" : role}
      </span>

      <div className="flex items-center gap-1 ml-1">
        {/* Discussion icon hint */}
        <MessageSquare className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition"
                       style={{ color: "var(--p400)" }} />
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                      style={{ color: "var(--tx-muted)" }} />
      </div>

      {/* Stop propagation for leave button */}
      {!isClubAdmin && (
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLeave(club); }}
                className="text-xs px-2 py-1 rounded-lg transition ml-1"
                style={{ color: "var(--tx-muted)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "#fee2e2"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--tx-muted)"; e.currentTarget.style.background = "transparent"; }}>
          Leave
        </button>
      )}
    </Link>
  );
};

// ── Club logo helper ──────────────────────────────────────────────────────────
export const ClubLogo = ({ club, size = "md" }) => {
  const sizes = { sm: "w-10 h-10 rounded-xl text-sm", md: "w-14 h-14 rounded-2xl text-lg", lg: "w-20 h-20 rounded-2xl text-2xl" };
  const COLORS = [
    { bg: "var(--p100)",  color: "var(--p600)" },
    { bg: "#f3e8ff",      color: "#7c3aed"     },
    { bg: "#ccfbf1",      color: "#0f766e"     },
    { bg: "#fce7f3",      color: "#9d174d"     },
    { bg: "#fef3c7",      color: "#92400e"     },
  ];
  const { bg, color } = COLORS[(club.name?.charCodeAt(0) ?? 0) % COLORS.length];

  if (club.logo?.url) return (
    <img src={club.logo.url} alt={club.name} className={cn("object-cover shrink-0", sizes[size])} />
  );
  return (
    <div className={cn("flex items-center justify-center font-bold shrink-0", sizes[size])}
         style={{ background: bg, color, fontFamily: "Syne, sans-serif" }}>
      {club.name?.[0]?.toUpperCase()}
    </div>
  );
};

export default ClubsPage;
