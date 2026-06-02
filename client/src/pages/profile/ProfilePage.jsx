// client/src/pages/profile/ProfilePage.jsx
import { useState, useEffect,
         useCallback }              from "react";
import { useParams, useNavigate,
         Link }                     from "react-router-dom";
import {
  ArrowLeft, Edit, UserPlus,
  UserMinus, Globe, GraduationCap,
  MapPin, Calendar, Bookmark,
  Grid3x3, User, MessageSquare,
}                                   from "lucide-react";
import { authApi }                  from "@/api/authApi";
import { postApi }                  from "@/api/postApi";
import axiosInstance                from "@/api/axiosInstance";
import useAuth                      from "@/hooks/useAuth";
import useInfiniteScroll            from "@/hooks/useInfiniteScroll";
import Avatar                       from "@/components/common/Avatar";
import { PageSpinner }              from "@/components/common/Spinner";
import EmptyState                   from "@/components/common/EmptyState";
import PostCard                     from "@/components/feed/PostCard";
import PostSkeleton                 from "@/components/feed/PostSkeleton";
import Modal                        from "@/components/common/Modal";
import { timeAgo, formatDate }      from "@/utils/formatDate";
import cn                           from "@/utils/cn";
import toast                        from "react-hot-toast";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter
} from "react-icons/fa";

const TABS = [
  { key: "posts",     label: "Posts",     icon: Grid3x3 },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { key: "about",     label: "About",     icon: User     },
];

const ProfilePage = () => {
  const { username }        = useParams();
  const navigate            = useNavigate();
  const { user: me }        = useAuth();

  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [activeTab,   setActiveTab]   = useState("posts");
  const [posts,       setPosts]       = useState([]);
  const [bookmarks,   setBookmarks]   = useState([]);
  const [cursor,      setCursor]      = useState(null);
  const [hasMore,     setHasMore]     = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [requestSent, setRequestSent]   = useState(false);
  const [followCount, setFollowCount] = useState({ followers: 0, following: 0 });
  const [followModal, setFollowModal] = useState(null); // "followers" | "following"
  const [followList,  setFollowList]  = useState([]);
  const [followLoad,  setFollowLoad]  = useState(false);

  const isOwnProfile = me?.username === username;

  // ── Fetch profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setPosts([]);
      setCursor(null);
      setHasMore(true);
      try {
        const { data } = await axiosInstance.get(`/users/${username}`);
        const p        = data.data;
        setProfile(p);
        setFollowCount({
          followers: p.followers?.length ?? 0,
          following: p.following?.length ?? 0,
        });
        const myIdStr = me?._id?.toString();
        setIsFollowing(p.followers?.some((f) => f.toString?.() === myIdStr || f === myIdStr) ?? false);
        setRequestSent(p.followRequests?.some((r) => r.toString?.() === myIdStr || r === myIdStr) ?? false);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [username, me?._id]);

  // ── Fetch posts ─────────────────────────────────────────────────────────────
  const loadPosts = useCallback(async (cursorVal = null) => {
    if (!profile || postLoading) return;
    setPostLoading(true);
    try {
      const { data } = await postApi.getPostsByUser(profile._id, {
        cursor: cursorVal,
        limit:  9,
      });
      const result = data.data;
      if (cursorVal) {
        setPosts((prev) => {
          const ids  = new Set(prev.map((p) => p._id));
          return [...prev, ...result.posts.filter((p) => !ids.has(p._id))];
        });
      } else {
        setPosts(result.posts ?? []);
      }
      setCursor(result.nextCursor);
      setHasMore(result.hasMore ?? false);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setPostLoading(false);
    }
  }, [profile, postLoading]);

  useEffect(() => {
    if (profile && activeTab === "posts") loadPosts(null);
  }, [profile, activeTab]);

  // ── Fetch bookmarks (own profile only) ──────────────────────────────────────
  useEffect(() => {
    if (!isOwnProfile || activeTab !== "bookmarks") return;
    const load = async () => {
      try {
        const { data } = await axiosInstance.get("/users/me/bookmarks");
        setBookmarks(data.data ?? []);
      } catch { /* non-critical */ }
    };
    load();
  }, [isOwnProfile, activeTab]);

  // ── Infinite scroll ─────────────────────────────────────────────────────────
  const loadMore    = useCallback(() => {
    if (cursor) loadPosts(cursor);
  }, [cursor, loadPosts]);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore, postLoading);

  // ── Follow / unfollow / request ─────────────────────────────────────────────
  const handleFollow = useCallback(async () => {
    try {
      const { data } = await axiosInstance.post(`/users/${profile._id}/follow`);
      const status = data.data?.status;
      if (status === "unfollowed") {
        setIsFollowing(false);
        setFollowCount((p) => ({ ...p, followers: Math.max(0, p.followers - 1) }));
        toast.success("Unfollowed");
      } else if (status === "request_sent") {
        setRequestSent(true);
        toast.success("Follow request sent");
      } else if (status === "request_cancelled") {
        setRequestSent(false);
        toast.success("Request cancelled");
      } else if (status === "followed") {
        setIsFollowing(true);
        setFollowCount((p) => ({ ...p, followers: p.followers + 1 }));
      }
    } catch {
      toast.error("Failed to update follow");
    }
  }, [profile]);

  // ── Load followers / following list ─────────────────────────────────────────
  const openFollowModal = useCallback(async (type) => {
    setFollowModal(type);
    setFollowLoad(true);
    try {
      const { data } = await axiosInstance.get(
        `/users/${profile._id}/${type}`
      );
      setFollowList(data.data ?? []);
    } catch {
      toast.error(`Failed to load ${type}`);
    } finally {
      setFollowLoad(false);
    }
  }, [profile]);

  if (loading)  return <PageSpinner />;
  if (notFound) {
    return (
      <EmptyState
        icon={User}
        title="User not found"
        description="This profile doesn't exist or has been removed."
        action={
          <button
            onClick={() => navigate("/feed")}
            className="btn-primary px-5 py-2 text-sm"
          >
            Back to feed
          </button>
        }
      />
    );
  }
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium transition" style={{ color: "var(--tx-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* ── Profile card ── */}
      <div className="card rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>

        {/* Cover */}
        <div className="h-28" style={{ background: "linear-gradient(135deg, var(--p100), var(--p200), #fce7f3)" }} />

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="rounded-full" style={{ border: "4px solid var(--bg)", borderRadius: "50%", display: "inline-block" }}>
              <Avatar
                src={profile.profilePicture}
                name={profile.username}
                size="xl"
              />
            </div>

            <div className="flex items-center gap-2 mt-10">
              {isOwnProfile ? (
                <Link
                  to="/profile/edit"
                  className="btn-ghost flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit profile
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    className={isFollowing || requestSent ? "btn-ghost flex items-center gap-1.5 px-4 py-2 text-sm" : "btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"}
                  >
                    {isFollowing ? (
                      <><UserMinus className="w-4 h-4" /> Unfollow</>
                    ) : requestSent ? (
                      <><UserMinus className="w-4 h-4" /> Requested</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Follow</>
                    )}
                  </button>
                  <Link
                    to={`/messages/${profile._id}`}
                    className="btn-ghost flex items-center gap-1.5 px-4 py-2 text-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Name + badges */}
          <div className="mb-1 flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
              {profile.username}
            </h1>
            {profile.isVerified && (
              <span className="text-indigo-500 text-sm">✓</span>
            )}
            <span className={`badge ${profile.role === "admin" ? "badge-red" : profile.role === "club" ? "badge-purple" : "badge"} capitalize`}>
              {profile.role}
            </span>
          </div>

          {/* College + year */}
          {(profile.college || profile.graduationYear) && (
            <p className="text-sm flex items-center gap-1.5 mb-2" style={{ color: "var(--tx-muted)" }}>
              <GraduationCap className="w-4 h-4" style={{ color: "var(--p400)" }} />
              {profile.college}
              {profile.graduationYear && ` · Batch of ${profile.graduationYear}`}
            </p>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--tx)" }}>
              {profile.bio}
            </p>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="tag-chip"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Social links */}
          {(profile.socialLinks?.github ||
            profile.socialLinks?.linkedin ||
            profile.socialLinks?.twitter) && (
            <div className="flex items-center gap-3 mb-4">
              {profile.socialLinks.github && (
                <a
                  href={profile.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition" style={{ color: "var(--tx-muted)" }}
                  aria-label="GitHub"
                >
                  <FaGithub className="w-4 h-4" />
                </a>
              )}
              {profile.socialLinks.linkedin && (
                <a
                  href={profile.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition" style={{ color: "var(--tx-muted)" }}
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="w-4 h-4" />
                </a>
              )}
              {profile.socialLinks.twitter && (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition" style={{ color: "var(--tx-muted)" }}
                  aria-label="Twitter"
                >
                  <FaTwitter className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="flex border-t border-gray-100 pt-4 -mx-6 px-6">
            <div className="flex-1 text-center">
              <p className="font-bold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>{posts.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Posts</p>
            </div>
            <button
              onClick={() => openFollowModal("followers")}
              className="flex-1 text-center hover:bg-gray-50 rounded-xl
                         transition py-1"
            >
              <p className="font-bold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                {followCount.followers}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Followers</p>
            </button>
            <button
              onClick={() => openFollowModal("following")}
              className="flex-1 text-center hover:bg-gray-50 rounded-xl
                         transition py-1"
            >
              <p className="font-bold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                {followCount.following}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Following</p>
            </button>
            <div className="flex-1 text-center">
              <p className="font-bold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                {profile.posts?.length ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs card ── */}
      <div className="card rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>

        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: "1.5px solid var(--border)" }}>
          {TABS.filter((t) =>
            t.key !== "bookmarks" || isOwnProfile
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3.5",
                "text-sm font-medium transition border-b-2",
                activeTab === key
                  ? "text-indigo-600 border-indigo-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Posts tab ── */}
        {activeTab === "posts" && (
          <div className="p-5">
            {posts.length === 0 && !postLoading ? (
              <EmptyState
                icon={Grid3x3}
                title="No posts yet"
                description={
                  isOwnProfile
                    ? "Share something with your community"
                    : `${profile.username} hasn't posted yet`
                }
                action={
                  isOwnProfile && (
                    <Link
                      to="/feed"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl
                                 text-sm font-medium hover:bg-indigo-700 transition"
                    >
                      Create first post
                    </Link>
                  )
                }
              />
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
                {postLoading && Array.from({ length: 2 }).map((_, i) => (
                  <PostSkeleton key={i} />
                ))}
                <div ref={sentinelRef} className="h-4" />
                {!hasMore && posts.length > 0 && (
                  <p className="text-center text-sm py-4" style={{ color: "var(--tx-light)" }}>
                    All posts loaded
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Bookmarks tab (own profile only) ── */}
        {activeTab === "bookmarks" && isOwnProfile && (
          <div className="p-5">
            {bookmarks.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="No bookmarks yet"
                description="Posts you bookmark will appear here"
              />
            ) : (
              <div className="space-y-4">
                {bookmarks.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── About tab ── */}
        {activeTab === "about" && (
          <div className="p-5 space-y-5">

            {/* Info rows */}
            <div className="space-y-3">
              {profile.college && (
                <div className="flex items-center gap-3 text-sm" style={{ color: "var(--tx)" }}>
                  <GraduationCap className="w-4 h-4 shrink-0" style={{ color: "var(--p400)" }} />
                  <span className="" style={{ color: "var(--tx)" }}>
                    {profile.college}
                    {profile.graduationYear &&
                      ` · Graduating ${profile.graduationYear}`}
                  </span>
                </div>
              )}
              {profile.gender && (
                <div className="flex items-center gap-3 text-sm" style={{ color: "var(--tx)" }}>
                  <User className="w-4 h-4 shrink-0" style={{ color: "var(--p400)" }} />
                  <span className="capitalize" style={{ color: "var(--tx)" }}>
                    {profile.gender}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm" style={{ color: "var(--tx)" }}>
                <Calendar className="w-4 h-4 shrink-0" style={{ color: "var(--p400)" }} />
                <span className="" style={{ color: "var(--tx)" }}>
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>

            {/* Skills section */}
            {profile.skills?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--tx-muted)" }}>
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="tag-chip"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {(profile.socialLinks?.github ||
              profile.socialLinks?.linkedin ||
              profile.socialLinks?.twitter) && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--tx-muted)" }}>
                  Links
                </p>
                <div className="space-y-2">
                  {profile.socialLinks.github && (
                    <a
                      href={profile.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm transition" style={{ color: "var(--tx)" }}
                    >
                      <Github className="w-4 h-4 text-gray-400" />
                      {profile.socialLinks.github.replace("https://", "")}
                    </a>
                  )}
                  {profile.socialLinks.linkedin && (
                    <a
                      href={profile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm transition" style={{ color: "var(--tx)" }}
                    >
                      <Linkedin className="w-4 h-4 text-gray-400" />
                      {profile.socialLinks.linkedin.replace("https://", "")}
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm transition" style={{ color: "var(--tx)" }}
                    >
                      <Twitter className="w-4 h-4 text-gray-400" />
                      {profile.socialLinks.twitter.replace("https://", "")}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Last seen */}
            <p className="text-xs" style={{ color: "var(--tx-light)" }}>
              Last active {timeAgo(profile.lastSeen ?? profile.updatedAt)}
            </p>
          </div>
        )}
      </div>

      {/* ── Followers / Following modal ── */}
      <Modal
        isOpen={!!followModal}
        onClose={() => { setFollowModal(null); setFollowList([]); }}
        title={followModal === "followers" ? "Followers" : "Following"}
        size="sm"
      >
        {followLoad ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--p200)", borderTopColor: "var(--p500)" }} />
          </div>
        ) : followList.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: "var(--tx-muted)" }}>
            {followModal === "followers" ? "No followers yet" : "Not following anyone"}
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {followList.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u.username}`}
                onClick={() => setFollowModal(null)}
                className="flex items-center gap-3 p-2 rounded-xl transition" onMouseEnter={e => e.currentTarget.style.background="var(--p50)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}
              >
                <Avatar
                  src={u.profilePicture}
                  name={u.username}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                    {u.username}
                    {u.isVerified && (
                      <span className="ml-1 text-indigo-500 text-xs">✓</span>
                    )}
                  </p>
                  {u.bio && (
                    <p className="text-xs truncate" style={{ color: "var(--tx-muted)" }}>{u.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default ProfilePage;