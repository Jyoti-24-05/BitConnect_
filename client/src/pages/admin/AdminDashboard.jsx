// client/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { Navigate, Link }                   from "react-router-dom";
import {
  Users, Calendar, BookOpen,
  ShieldCheck, TrendingUp,
  AlertTriangle, CheckCircle,
  XCircle, Ban, RefreshCw,
  Search, ChevronLeft, ChevronRight,
}                                           from "lucide-react";
import { adminApi }                         from "@/api/adminApi";
import useAuth                              from "@/hooks/useAuth";
import Avatar                              from "@/components/common/Avatar";
import { PageSpinner }                     from "@/components/common/Spinner";
import { timeAgo }                         from "@/utils/formatDate";
import cn                                  from "@/utils/cn";
import toast                               from "react-hot-toast";

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm" style={{ color: "var(--tx-muted)" }}>{label}</p>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl font-semibold text-gray-900">{value ?? "—"}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, count, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-bold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
      {title}
      {count !== undefined && (
        <span className="ml-2 text-sm text-gray-400 font-normal">({count})</span>
      )}
    </h2>
    {action}
  </div>
);

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Overview"      },
  { key: "users",    label: "Users"         },
  { key: "events",   label: "Pending events" },
  { key: "posts",    label: "Flagged posts"  },
];

// ─── Main component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();

  const [tab,          setTab]          = useState("overview");
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [userPage,     setUserPage]     = useState(1);
  const [userTotal,    setUserTotal]    = useState(0);
  const [userSearch,   setUserSearch]   = useState("");
  const [userRole,     setUserRole]     = useState("");
  const [pendingEvents,setPendingEvents]= useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [range,        setRange]        = useState("30");

  // Guard — redirect non-admins
  if (!isAdmin) return <Navigate to="/feed" replace />;

  // ── Load stats ──────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getStats({ range });
      setStats(data.data);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [range]);

  // ── Load users ──────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers({
        page:   userPage,
        limit:  15,
        role:   userRole   || undefined,
        search: userSearch || undefined,
      });
      setUsers(data.data.users);
      setUserTotal(data.data.pagination.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [userPage, userRole, userSearch]);

  // ── Load pending events ─────────────────────────────────────────────────────
  const loadPendingEvents = useCallback(async () => {
    try {
      const { data } = await adminApi.getPendingEvents();
      setPendingEvents(data.data ?? []);
    } catch { /* non-critical */ }
  }, []);

  // ── Load flagged posts ──────────────────────────────────────────────────────
  const loadFlaggedPosts = useCallback(async () => {
    try {
      const { data } = await adminApi.getPosts();
      setFlaggedPosts(data.data ?? []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    if (tab === "overview") loadStats();
    if (tab === "users")    loadUsers();
    if (tab === "events")   loadPendingEvents();
    if (tab === "posts")    loadFlaggedPosts();
  }, [tab, range]);

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [userPage, userRole, userSearch]);

  // ── User actions ────────────────────────────────────────────────────────────
  const toggleUserActive = async (userId, isActive) => {
    try {
      await adminApi.updateUser(userId, { isActive: !isActive });
      setUsers((p) =>
        p.map((u) => u._id === userId ? { ...u, isActive: !isActive } : u)
      );
      toast.success(isActive ? "User suspended" : "User reinstated");
    } catch {
      toast.error("Failed to update user");
    }
  };

  const changeUserRole = async (userId, role) => {
    try {
      await adminApi.updateUser(userId, { role });
      setUsers((p) =>
        p.map((u) => u._id === userId ? { ...u, role } : u)
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  // ── Event actions ───────────────────────────────────────────────────────────
  const handleEventApproval = async (eventId, approve) => {
    try {
      await adminApi.approveEvent(eventId, approve);
      setPendingEvents((p) => p.filter((e) => e._id !== eventId));
      toast.success(approve ? "Event approved!" : "Event rejected");
    } catch {
      toast.error("Failed to update event");
    }
  };

  // ── Post actions ────────────────────────────────────────────────────────────
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await adminApi.deletePost(postId);
      setFlaggedPosts((p) => p.filter((post) => post._id !== postId));
      toast.success("Post removed");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const ROLE_COLORS = {
    admin:   "bg-red-50 text-red-700",
    club:    "bg-purple-50 text-purple-700",
    student: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>Admin dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--tx-muted)" }}>
            Logged in as <span className="font-medium text-indigo-600">{user?.username}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2
                       outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={() => {
              if (tab === "overview") loadStats();
              if (tab === "users")   loadUsers();
            }}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50
                       transition text-gray-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition",
              tab === key
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
            {key === "events" && pendingEvents.length > 0 && (
              <span className="ml-1.5 text-xs bg-amber-500 text-white
                               px-1.5 py-0.5 rounded-full">
                {pendingEvents.length}
              </span>
            )}
            {key === "posts" && flaggedPosts.length > 0 && (
              <span className="ml-1.5 text-xs bg-red-500 text-white
                               px-1.5 py-0.5 rounded-full">
                {flaggedPosts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && !stats && <PageSpinner />}

      {/* ── Overview tab ── */}
      {tab === "overview" && stats && (
        <div className="space-y-5">

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total users"
              value={stats.users.total}
              sub={`+${stats.users.new} this period`}
              icon={Users}
              color="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              label="Total posts"
              value={stats.posts.total}
              sub={`+${stats.posts.new} this period`}
              icon={BookOpen}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              label="Active events"
              value={stats.events.active}
              sub={`${stats.events.total} total`}
              icon={Calendar}
              color="bg-teal-50 text-teal-600"
            />
            <StatCard
              label="Clubs"
              value={stats.clubs.total}
              icon={ShieldCheck}
              color="bg-amber-50 text-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Role breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-5">
              <SectionHeader title="User role breakdown" />
              <div className="space-y-3">
                {stats.roleBreakdown.map(({ _id: role, count }) => {
                  const total   = stats.users.total || 1;
                  const pct     = Math.round((count / total) * 100);
                  const colors  = {
                    student: "bg-indigo-500",
                    club:    "bg-purple-500",
                    admin:   "bg-red-500",
                  };
                  return (
                    <div key={role}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 capitalize">{role}s</span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", colors[role] ?? "bg-gray-400")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top clubs */}
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-5">
              <SectionHeader title="Top clubs by members" />
              <div className="space-y-2">
                {stats.topClubs.length === 0 && (
                  <p className="text-sm text-gray-400">No clubs yet</p>
                )}
                {stats.topClubs.map((club, i) => (
                  <div key={club._id}
                       className="flex items-center gap-3 py-1.5">
                    <span className="text-sm font-medium text-gray-400 w-4">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/clubs/${club.slug}`}
                        className="text-sm font-medium text-gray-900
                                   hover:text-indigo-600 transition truncate block"
                      >
                        {club.name}
                        {club.isVerified && (
                          <span className="ml-1 text-indigo-500 text-xs">✓</span>
                        )}
                      </Link>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {club.memberCount ?? 0} members
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Posts per day chart */}
          {stats.postsPerDay.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-5">
              <SectionHeader title="Post activity" />
              <div style={{ position: "relative", height: "220px" }}>
                <canvas
                  id="adminPostChart"
                  role="img"
                  aria-label="Bar chart of daily post activity"
                >
                  Daily posts over selected period.
                </canvas>
              </div>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    if (window.Chart && document.getElementById('adminPostChart')) {
                      new Chart(document.getElementById('adminPostChart'), {
                        type: 'bar',
                        data: {
                          labels: ${JSON.stringify(stats.postsPerDay.map((d) => d._id))},
                          datasets: [{
                            label: 'Posts',
                            data:   ${JSON.stringify(stats.postsPerDay.map((d) => d.count))},
                            backgroundColor: '#4F46E5',
                            borderRadius: 4,
                          }]
                        },
                        options: {
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                        }
                      });
                    }
                  `,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Users tab ── */}
      {tab === "users" && (
        <div className="card rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>

          {/* Filters */}
          <div className="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2
                                  w-4 h-4 text-gray-400" />
              <input
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                placeholder="Search by username or email..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200
                           rounded-xl text-sm outline-none focus:ring-2
                           focus:ring-indigo-200 transition"
              />
            </div>
            <select
              value={userRole}
              onChange={(e) => { setUserRole(e.target.value); setUserPage(1); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2
                         outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All roles</option>
              <option value="student">Students</option>
              <option value="club">Clubs</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* User table */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 font-medium
                                  px-4 py-3 w-[200px]">User</th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                  px-4 py-3 w-[80px]">Role</th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                  px-4 py-3 w-[80px]">Status</th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                  px-4 py-3 hidden sm:table-cell">Joined</th>
                  <th className="text-right text-xs text-gray-400 font-medium
                                  px-4 py-3 w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={u.profilePicture}
                          name={u.username}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/profile/${u.username}`}
                            className="text-sm font-medium text-gray-900
                                       hover:text-indigo-600 transition truncate block"
                          >
                            {u.username}
                          </Link>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeUserRole(u._id, e.target.value)}
                        className={cn(
                          "text-xs font-medium px-2 py-1 rounded-full border-0",
                          "outline-none cursor-pointer",
                          ROLE_COLORS[u.role]
                        )}
                      >
                        <option value="student">student</option>
                        <option value="club">club</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        u.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      )}>
                        {u.isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-400">
                        {timeAgo(u.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleUserActive(u._id, u.isActive)}
                          className={cn(
                            "flex items-center gap-1 text-xs px-3 py-1.5",
                            "border rounded-lg transition",
                            u.isActive
                              ? "border-red-200 text-red-500 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          )}
                        >
                          {u.isActive
                            ? <><Ban className="w-3 h-3" /> Suspend</>
                            : <><CheckCircle className="w-3 h-3" /> Reinstate</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && !loading && (
              <p className="text-center text-sm text-gray-400 py-10">
                No users found
              </p>
            )}
          </div>

          {/* Pagination */}
          {userTotal > 15 && (
            <div className="flex items-center justify-between px-4 py-3
                            border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {Math.min((userPage - 1) * 15 + 1, userTotal)}–
                {Math.min(userPage * 15, userTotal)} of {userTotal}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                  className="p-1.5 border border-gray-200 rounded-lg
                             hover:bg-gray-50 transition disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setUserPage((p) => p + 1)}
                  disabled={userPage * 15 >= userTotal}
                  className="p-1.5 border border-gray-200 rounded-lg
                             hover:bg-gray-50 transition disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Pending events tab ── */}
      {tab === "events" && (
        <div className="space-y-3">
          {pendingEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-12 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">All caught up — no pending events</p>
            </div>
          ) : (
            pendingEvents.map((event) => (
              <div key={event._id}
                   className="bg-white rounded-2xl border border-gray-100
                               shadow-sm p-5 flex items-start gap-4">
                {/* Banner thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden
                                bg-indigo-50 flex items-center justify-center shrink-0">
                  {event.banner?.url ? (
                    <img src={event.banner.url} alt=""
                         className="w-full h-full object-cover" />
                  ) : (
                    <Calendar className="w-6 h-6 text-indigo-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    By {event.organizer?.username}
                    {event.club && ` · ${event.club.name}`}
                    {" · "}
                    {new Date(event.startDate).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {event.description}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleEventApproval(event._id, true)}
                    className="flex items-center gap-1.5 text-xs font-medium
                               px-3 py-1.5 bg-green-600 text-white rounded-lg
                               hover:bg-green-700 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleEventApproval(event._id, false)}
                    className="flex items-center gap-1.5 text-xs font-medium
                               px-3 py-1.5 border border-red-200 text-red-600
                               rounded-lg hover:bg-red-50 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Flagged posts tab ── */}
      {tab === "posts" && (
        <div className="space-y-3">
          {flaggedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100
                            shadow-sm p-12 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No flagged posts</p>
            </div>
          ) : (
            flaggedPosts.map((post) => (
              <div key={post._id}
                   className="bg-white rounded-2xl border border-red-100
                               shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar
                      src={post.author?.profilePicture}
                      name={post.author?.username}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                        {post.author?.username}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      to={`/posts/${post._id}`}
                      className="text-xs text-indigo-600 border border-indigo-200
                                 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="flex items-center gap-1 text-xs text-red-600
                                 border border-red-200 px-3 py-1.5 rounded-lg
                                 hover:bg-red-50 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {post.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;