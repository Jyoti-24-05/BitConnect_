// client/src/pages/clubs/ClubsPage.jsx
import { useState, useEffect,
         useCallback }              from "react";
import { Link }                     from "react-router-dom";
import { Search, Users,
         Plus, X, Shield }          from "lucide-react";
import { clubApi }                  from "@/api/clubApi";
import useAuth                      from "@/hooks/useAuth";
import useDebounce                  from "@/hooks/useDebounce";
import useInfiniteScroll            from "@/hooks/useInfiniteScroll";
import ClubCard                     from "@/components/clubs/ClubCard";
import ClubSkeleton                 from "@/components/clubs/ClubSkeleton";
import EmptyState                   from "@/components/common/EmptyState";
import { CLUB_CATEGORIES }          from "@/utils/constants";
import cn                           from "@/utils/cn";
import toast                        from "react-hot-toast";

const ClubsPage = () => {
  const { user, isAdmin }     = useAuth();

  const [clubs,      setClubs]      = useState([]);
  const [myClubs,    setMyClubs]    = useState([]);
  const [cursor,     setCursor]     = useState(null);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [myLoading,  setMyLoading]  = useState(false);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("");
  // Track join status per club: "joined" | "pending" | null
  const [joinStatus, setJoinStatus] = useState({});

  const debouncedSearch = useDebounce(search, 400);

  // ── Load clubs the current user is a member of ─────────────────────────────
  useEffect(() => {
    const fetchMyClubs = async () => {
      setMyLoading(true);
      try {
        const { data } = await clubApi.discoverClubs({ limit: 50 });
        const all      = data.data.clubs ?? [];
        // Filter to clubs where user is active member
        const mine     = all.filter((c) =>
          c.members?.some(
            (m) =>
              (m.user?._id ?? m.user) === user?._id &&
              m.status === "active"
          )
        );
        setMyClubs(mine);
      } catch { /* non-critical */ }
      finally   { setMyLoading(false); }
    };
    if (user) fetchMyClubs();
  }, [user]);

  // ── Load discover clubs ─────────────────────────────────────────────────────
  const loadClubs = useCallback(async (cursorVal = null) => {
    if (loading) return;
    setLoading(true);
    try {
      let result;

      if (debouncedSearch.trim()) {
        const { data } = await clubApi.searchClubs({
          q:     debouncedSearch,
          limit: 12,
          skip:  cursorVal ? clubs.length : 0,
        });
        result = {
          clubs:      data.data,
          nextCursor: data.data.length === 12 ? "more" : null,
          hasMore:    data.data.length === 12,
        };
      } else {
        const { data } = await clubApi.discoverClubs({
          cursor:   cursorVal,
          limit:    12,
          category: category || undefined,
        });
        result = data.data;
      }

      if (cursorVal) {
        setClubs((prev) => {
          const ids  = new Set(prev.map((c) => c._id));
          const news = result.clubs.filter((c) => !ids.has(c._id));
          return [...prev, ...news];
        });
      } else {
        setClubs(result.clubs ?? []);
      }

      setCursor(result.nextCursor);
      setHasMore(result.hasMore ?? false);
    } catch {
      toast.error("Failed to load clubs");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, clubs.length, loading]);

  useEffect(() => {
    setClubs([]);
    setCursor(null);
    setHasMore(true);
    loadClubs(null);
  }, [debouncedSearch, category]);

  const loadMore    = useCallback(() => {
    if (cursor && cursor !== "more") loadClubs(cursor);
  }, [cursor, loadClubs]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading);

  // ── Handle join / leave ─────────────────────────────────────────────────────

  const sid = (id) => id?.toString() ?? id;

  const handleJoin = useCallback(async (club) => {
  const id   = sid(club._id);
  const prev = joinStatus[id];

  // Optimistic update
  setJoinStatus((p) => ({
    ...p,
    [id]: club.isPrivate ? "pending" : "joined",
  }));

  try {
    const { data } = await clubApi.joinClub(id);
    const status   = data.data?.status ?? (club.isPrivate ? "pending" : "joined");

    setJoinStatus((p) => ({ ...p, [id]: status }));

    if (status === "joined") {
      toast.success(`Welcome to ${club.name}!`);
      setMyClubs((p) => [
        ...p,
        { ...club, _id: id, memberCount: (club.memberCount ?? 0) + 1 },
      ]);
    } else {
      toast.success("Join request sent to the admin!");
    }
  } catch (err) {
    // Roll back
    setJoinStatus((p) => ({ ...p, [id]: prev }));
    toast.error(err.response?.data?.message ?? "Failed to join");
  }
}, [joinStatus]);

  const handleLeave = useCallback(async (club) => {
  const id = sid(club._id);
  if (!window.confirm(`Leave ${club.name}?`)) return;
  try {
    await clubApi.leaveClub(id);
    setJoinStatus((p) => ({ ...p, [id]: null }));
    setMyClubs((p) => p.filter((c) => sid(c._id) !== id));
    toast.success(`Left ${club.name}`);
  } catch (err) {
    toast.error(err.response?.data?.message ?? "Failed to leave");
  }
}, []);

  // Compute status for a club
  const getStatus = (club) => {
  const id = sid(club._id);
  if (joinStatus[id] !== undefined) return joinStatus[id];
  const isMember = myClubs.some((c) => sid(c._id) === id);
  return isMember ? "joined" : null;
};

  const CATEGORY_OPTIONS = [
    { value: "", label: "All" },
    ...CLUB_CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clubs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Discover and join student organisations
          </p>
        </div>
        <Link
          to="/clubs/create"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600
                     text-white text-sm font-medium rounded-xl
                     hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Create club
        </Link>
      </div>

      {/* ── Search + filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs..."
            className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200
                       rounded-xl text-sm outline-none focus:ring-2
                       focus:ring-indigo-200 focus:border-indigo-300 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium",
                "border transition capitalize",
                category === value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── My clubs section ── */}
      {myClubs.length > 0 && !search && !category && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase
                         tracking-wide mb-3">
            My clubs
          </h2>
          <div className="space-y-2">
            {myClubs.map((club) => (
              <MyClubRow
                key={club._id}
                club={club}
                userId={user?._id}
                onLeave={handleLeave}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Discover section ── */}
      <div>
        {(search || category || myClubs.length > 0) && (
          <h2 className="text-sm font-semibold text-gray-500 uppercase
                         tracking-wide mb-3">
            {search ? `Results for "${search}"` : category ? `${category} clubs` : "Discover"}
          </h2>
        )}

        {clubs.length === 0 && !loading ? (
          <EmptyState
            icon={Users}
            title="No clubs found"
            description={
              search || category
                ? "Try a different search or category"
                : "No clubs yet — be the first to create one!"
            }
            action={
              !search && (
                <Link
                  to="/clubs/create"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl
                             text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Create a club
                </Link>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clubs
  .filter((c) => !myClubs.some((m) => sid(m._id) === sid(c._id)))
  .map((club) => (
    <ClubCard
      key={sid(club._id)}
      club={{ ...club, _id: sid(club._id) }}  
      status={getStatus(club)}
      onJoin={handleJoin}
      onLeave={handleLeave}
    />
  ))}

            {loading && Array.from({ length: 4 }).map((_, i) => (
              <ClubSkeleton key={i} />
            ))}
          </div>
        )}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {!hasMore && !loading && clubs.length > 0 && (
        <p className="text-center text-sm text-gray-400 py-4">
          All clubs loaded
        </p>
      )}
    </div>
  );
};

// ─── My club row (compact) ────────────────────────────────────────────────────
const MyClubRow = ({ club, userId, onLeave }) => {
  const myMember = club.members?.find(
    (m) => (m.user?._id ?? m.user) === userId
  );
  const role = myMember?.role ?? "member";
  const isAdmin = club.admin?._id === userId || club.admin === userId;

  return (
    <div className="bg-white rounded-xl border border-gray-100
                    p-3 flex items-center gap-3">
      <ClubLogo club={club} size="sm" />

      <div className="flex-1 min-w-0">
        <Link
          to={`/clubs/${club.slug ?? club._id}`}
          className="font-medium text-sm text-gray-900
                     hover:text-indigo-600 transition line-clamp-1"
        >
          {club.name}
          {club.isVerified && (
            <span className="ml-1 text-indigo-500 text-xs">✓</span>
          )}
        </Link>
        <p className="text-xs text-gray-400 capitalize">
          {club.category} · {club.memberCount ?? 0} members
        </p>
      </div>

      <span className={cn(
        "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
        isAdmin || role === "co-admin"
          ? "bg-indigo-50 text-indigo-700"
          : role === "moderator"
            ? "bg-purple-50 text-purple-700"
            : "bg-gray-100 text-gray-600"
      )}>
        {isAdmin ? "admin" : role}
      </span>

      {!isAdmin && (
        <button
          onClick={() => onLeave(club)}
          className="text-xs text-gray-400 hover:text-red-500
                     transition px-2 py-1"
        >
          Leave
        </button>
      )}
    </div>
  );
};

// ─── Club logo helper ─────────────────────────────────────────────────────────
export const ClubLogo = ({ club, size = "md" }) => {
  const sizes = {
    sm: "w-10 h-10 rounded-xl text-sm",
    md: "w-14 h-14 rounded-2xl text-lg",
    lg: "w-20 h-20 rounded-2xl text-2xl",
  };

  if (club.logo?.url) {
    return (
      <img
        src={club.logo.url}
        alt={club.name}
        className={cn("object-cover shrink-0", sizes[size])}
      />
    );
  }

  const colors = [
    "bg-indigo-100 text-indigo-700",
    "bg-purple-100 text-purple-700",
    "bg-teal-100 text-teal-700",
    "bg-pink-100 text-pink-700",
    "bg-amber-100 text-amber-700",
  ];
  const color = colors[club.name?.charCodeAt(0) % colors.length];

  return (
    <div className={cn(
      "flex items-center justify-center font-semibold shrink-0",
      sizes[size],
      color
    )}>
      {club.name?.[0]?.toUpperCase()}
    </div>
  );
};

export default ClubsPage;