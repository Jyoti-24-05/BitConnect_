// client/src/pages/clubs/ClubDetailPage.jsx
import { useState, useEffect,
         useCallback }                from "react";
import { useParams, useNavigate,
         Link }                       from "react-router-dom";
import {
  ArrowLeft, Users, Calendar,
  Globe,
  Settings, UserPlus, LogOut,
  CheckCircle, Clock, Shield,
  Edit, Trash2,
}                                     from "lucide-react";
import { clubApi }                    from "@/api/clubApi";
import { eventApi }                   from "@/api/eventApi";
import useAuth                        from "@/hooks/useAuth";
import Avatar                         from "@/components/common/Avatar";
import { PageSpinner }                from "@/components/common/Spinner";
import EmptyState                     from "@/components/common/EmptyState";
import EventCard                      from "@/components/events/EventCard";
import Modal                          from "@/components/common/Modal";
import { ClubLogo }                   from "./ClubsPage";
import { timeAgo }                    from "@/utils/formatDate";
import cn                             from "@/utils/cn";
import toast                          from "react-hot-toast";

import { FaInstagram , FaLinkedin} from "react-icons/fa";

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = ["About", "Events", "Members"];

const ClubDetailPage = () => {
  const { slug }           = useParams();
  const navigate           = useNavigate();
  const { user, isAdmin }  = useAuth();

  const [club,         setClub]         = useState(null);
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [activeTab,    setActiveTab]    = useState("About");
  const [joinLoading,  setJoinLoading]  = useState(false);
  const [joinStatus,   setJoinStatus]   = useState(null);
  const [requestModal, setRequestModal] = useState(false);
  const [requestMsg,   setRequestMsg]   = useState("");
  const [requests,     setRequests]     = useState([]);

  // ── Fetch club ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await clubApi.getClub(slug);
        const c        = data.data;
        setClub(c);

        // Determine user's join status
        if (user) {
          const member = c.members?.find(
            (m) => (m.user?._id ?? m.user) === user._id
          );
          const pending = c.joinRequests?.find(
            (r) => (r.user?._id ?? r.user) === user._id &&
                    r.status === "pending"
          );
          if      (member)  setJoinStatus(member.role);
          else if (pending) setJoinStatus("pending");
          else              setJoinStatus(null);
        }

        // Fetch club events
        const evRes = await eventApi.getClubEvents(c._id);
        setEvents(evRes.data.data.events ?? []);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error("Failed to load club");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug, user]);

  // ── Join ────────────────────────────────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    if (!club) return;
    if (club.isPrivate) {
      setRequestModal(true);
      return;
    }
    setJoinLoading(true);
    try {
      const { data } = await clubApi.joinClub(club._id);
      setJoinStatus(data.data.status === "joined" ? "member" : "pending");
      toast.success(
        data.data.status === "joined"
          ? `Welcome to ${club.name}!`
          : "Join request sent!"
      );
      if (data.data.status === "joined") {
        setClub((prev) => ({
          ...prev,
          memberCount: (prev.memberCount ?? 0) + 1,
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to join");
    } finally {
      setJoinLoading(false);
    }
  }, [club]);

  // ── Send join request (private club) ────────────────────────────────────────
  const handleSendRequest = useCallback(async () => {
    setJoinLoading(true);
    try {
      await clubApi.joinClub(club._id, { message: requestMsg });
      setJoinStatus("pending");
      setRequestModal(false);
      toast.success("Join request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to send request");
    } finally {
      setJoinLoading(false);
    }
  }, [club, requestMsg]);

  // ── Leave ───────────────────────────────────────────────────────────────────
  const handleLeave = useCallback(async () => {
    if (!window.confirm(`Leave ${club.name}?`)) return;
    try {
      await clubApi.leaveClub(club._id);
      setJoinStatus(null);
      setClub((prev) => ({
        ...prev,
        memberCount: Math.max(0, (prev.memberCount ?? 1) - 1),
      }));
      toast.success(`Left ${club.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to leave");
    }
  }, [club]);

  // ── Handle join request (admin) ─────────────────────────────────────────────
  const handleRequest = useCallback(async (userId, action) => {
    try {
      await clubApi.handleJoinRequest(club._id, userId, { action });
      setClub((prev) => ({
        ...prev,
        joinRequests: prev.joinRequests.map((r) =>
          (r.user?._id ?? r.user) === userId
            ? { ...r, status: action === "approve" ? "approved" : "rejected" }
            : r
        ),
        ...(action === "approve" && {
          memberCount: (prev.memberCount ?? 0) + 1,
        }),
      }));
      toast.success(action === "approve" ? "Request approved!" : "Request rejected");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed");
    }
  }, [club]);

  if (loading)  return <PageSpinner />;
  if (notFound) {
    return (
      <EmptyState
        icon={Users}
        title="Club not found"
        description="This club may have been removed."
        action={
          <button
            onClick={() => navigate("/clubs")}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl
                       text-sm font-medium hover:bg-indigo-700 transition"
          >
            Browse clubs
          </button>
        }
      />
    );
  }
  if (!club) return null;

  const isClubAdmin   = club.admin?._id === user?._id || club.admin === user?._id;
  const isModerator   = club.members?.some(
    (m) => (m.user?._id ?? m.user) === user?._id &&
            m.role === "moderator" && m.status === "active"
  );
  const canManage     = isClubAdmin || isModerator || isAdmin;
  const isMember      = joinStatus && joinStatus !== "pending";
  const isPending     = joinStatus === "pending";
  const pendingReqs   = club.joinRequests?.filter((r) => r.status === "pending") ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500
                   hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to clubs
      </button>

      {/* ── Club header card ── */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm overflow-hidden">

        {/* Banner */}
        <div className="h-36 bg-gradient-to-r from-indigo-100 to-purple-100">
          {club.banner?.url && (
            <img
              src={club.banner.url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Logo + actions row */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="ring-4 ring-white rounded-2xl">
              <ClubLogo club={club} size="lg" />
            </div>

            <div className="flex items-center gap-2 mt-8">
              {canManage && (
                <Link
                  to={`/clubs/${slug}/manage`}
                  className="flex items-center gap-1.5 text-xs text-gray-500
                             border border-gray-200 px-3 py-1.5 rounded-lg
                             hover:bg-gray-50 transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage
                </Link>
              )}

              {!isMember && !isPending && (
                <button
                  onClick={handleJoin}
                  disabled={joinLoading}
                  className="flex items-center gap-1.5 text-sm font-medium
                             px-4 py-2 bg-indigo-600 text-white rounded-xl
                             hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  <UserPlus className="w-4 h-4" />
                  {club.isPrivate ? "Request to join" : "Join club"}
                </button>
              )}

              {isPending && (
                <span className="flex items-center gap-1.5 text-sm
                                 text-amber-700 bg-amber-50 border
                                 border-amber-100 px-4 py-2 rounded-xl">
                  <Clock className="w-4 h-4" />
                  Request pending
                </span>
              )}

              {isMember && !isClubAdmin && (
                <button
                  onClick={handleLeave}
                  className="flex items-center gap-1.5 text-sm text-gray-500
                             border border-gray-200 px-4 py-2 rounded-xl
                             hover:text-red-500 hover:border-red-200 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Leave
                </button>
              )}
            </div>
          </div>

          {/* Club name + badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {club.name}
            </h1>
            {club.isVerified && (
              <span className="flex items-center gap-1 text-xs font-medium
                               text-indigo-700 bg-indigo-50 px-2 py-0.5
                               rounded-full">
                <Shield className="w-3 h-3" />
                Verified
              </span>
            )}
            {club.isPrivate && (
              <span className="text-xs text-gray-500 bg-gray-100
                               px-2 py-0.5 rounded-full">
                Private
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-indigo-400" />
              {club.memberCount ?? 0} members
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {club.stats?.totalEvents ?? 0} events
            </span>
            <span className="capitalize text-xs bg-gray-100
                             text-gray-600 px-2.5 py-1 rounded-full">
              {club.category}
            </span>
          </div>

          {/* Social links */}
          {(club.socialLinks?.instagram ||
            club.socialLinks?.linkedin ||
            club.socialLinks?.website) && (
            <div className="flex items-center gap-3">
              {club.socialLinks.instagram && (
                <a
                  href={club.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pink-500 transition"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-4 h-4" />
                </a>
              )}
              {club.socialLinks.linkedin && (
                <a
                  href={club.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="w-4 h-4" />
                </a>
              )}
              {club.socialLinks.website && (
                <a
                  href={club.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-500 transition"
                  aria-label="Website"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Pending requests banner (admin only) ── */}
      {canManage && pendingReqs.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-3">
            {pendingReqs.length} pending join request{pendingReqs.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {pendingReqs.map((req) => (
              <div
                key={req.user?._id ?? req.user}
                className="flex items-center gap-3 bg-white rounded-xl p-3"
              >
                <Avatar
                  src={req.user?.profilePicture}
                  name={req.user?.username}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {req.user?.username}
                  </p>
                  {req.message && (
                    <p className="text-xs text-gray-500 truncate">
                      "{req.message}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleRequest(req.user?._id ?? req.user, "approve")
                    }
                    className="text-xs bg-green-600 text-white px-3 py-1.5
                               rounded-lg hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleRequest(req.user?._id ?? req.user, "reject")
                    }
                    className="text-xs border border-gray-200 text-gray-500
                               px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-100
                      shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3.5 text-sm font-medium transition",
                activeTab === tab
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab}
              {tab === "Members" && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({club.memberCount ?? 0})
                </span>
              )}
              {tab === "Events" && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({events.length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── About tab ── */}
          {activeTab === "About" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                {club.description}
              </p>

              {club.tags?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500
                                uppercase tracking-wide mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {club.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-indigo-600 bg-indigo-50
                                   px-2.5 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500
                              uppercase tracking-wide mb-3">
                  Admin
                </p>
                <Link
                  to={`/profile/${club.admin?.username}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar
                    src={club.admin?.profilePicture}
                    name={club.admin?.username}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900
                                  group-hover:text-indigo-600 transition">
                      {club.admin?.username}
                    </p>
                    <p className="text-xs text-gray-400">Club admin</p>
                  </div>
                </Link>
              </div>

              <p className="text-xs text-gray-400">
                Club created {timeAgo(club.createdAt)}
              </p>
            </div>
          )}

          {/* ── Events tab ── */}
          {activeTab === "Events" && (
            <div>
              {events.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No events yet"
                  description="This club hasn't posted any events."
                  action={
                    canManage && (
                      <Link
                        to="/events/create"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl
                                   text-sm font-medium hover:bg-indigo-700 transition"
                      >
                        Create first event
                      </Link>
                    )
                  }
                />
              ) : (
                <div className="grid gap-4">
                  {events.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Members tab ── */}
          {activeTab === "Members" && (
            <div className="space-y-2">
              {club.members
                ?.filter((m) => m.status === "active")
                .sort((a, b) => {
                  const order = { "co-admin": 0, moderator: 1, member: 2 };
                  return (order[a.role] ?? 3) - (order[b.role] ?? 3);
                })
                .map((member, i) => {
                  const isThisAdmin =
                    (member.user?._id ?? member.user) ===
                    (club.admin?._id ?? club.admin);

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2
                                 hover:bg-gray-50 rounded-xl transition"
                    >
                      <Avatar
                        src={member.user?.profilePicture}
                        name={member.user?.username}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/profile/${member.user?.username}`}
                          className="text-sm font-medium text-gray-900
                                     hover:text-indigo-600 transition"
                        >
                          {member.user?.username}
                        </Link>
                        <p className="text-xs text-gray-400">
                          Joined {timeAgo(member.joinedAt)}
                        </p>
                      </div>

                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                        isThisAdmin
                          ? "bg-indigo-50 text-indigo-700"
                          : member.role === "moderator"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-gray-100 text-gray-500"
                      )}>
                        {isThisAdmin ? "admin" : member.role}
                      </span>

                      {/* Role management (admin only) */}
                      {canManage && !isThisAdmin &&
                        (member.user?._id ?? member.user) !== user?._id && (
                        <select
                          defaultValue={member.role}
                          onChange={(e) =>
                            clubApi.updateMemberRole(
                              club._id,
                              member.user?._id ?? member.user,
                              { role: e.target.value }
                            ).then(() => toast.success("Role updated"))
                             .catch(() => toast.error("Failed to update role"))
                          }
                          className="text-xs border border-gray-200 rounded-lg
                                     px-2 py-1 text-gray-600 outline-none"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="co-admin">Co-admin</option>
                        </select>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Join request modal (private clubs) ── */}
      <Modal
        isOpen={requestModal}
        onClose={() => setRequestModal(false)}
        title={`Request to join ${club.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            This is a private club. Send a message with your request to
            help the admin decide.
          </p>
          <textarea
            value={requestMsg}
            onChange={(e) => setRequestMsg(e.target.value)}
            placeholder="Why do you want to join? (optional)"
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl
                       text-sm outline-none focus:ring-2 focus:ring-indigo-200
                       resize-none transition"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setRequestModal(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600
                         rounded-xl text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSendRequest}
              disabled={joinLoading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl
                         text-sm font-medium hover:bg-indigo-700 transition
                         disabled:opacity-60 flex items-center
                         justify-center gap-2"
            >
              {joinLoading && (
                <span className="w-4 h-4 border-2 border-white
                                 border-t-transparent rounded-full
                                 animate-spin" />
              )}
              Send request
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ClubDetailPage;