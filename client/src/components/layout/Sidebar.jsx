// client/src/components/layout/Sidebar.jsx
import { NavLink, Link }  from "react-router-dom";
import { Home, Calendar, Users, LayoutDashboard, PlusCircle,
         Bookmark, MessageSquare, GraduationCap, CalendarDays, Settings2,
         Bell, TrendingUp } from "lucide-react";
import useAuth            from "@/hooks/useAuth";

const NAV = [
  { to: "/feed",   label: "Home",       icon: Home },
  { to: "/events", label: "Events",     icon: Calendar },
  { to: "/clubs",  label: "Explore BIT",icon: Users },
];

const EXTRA = [
  { to: "/feed",         label: "Messages",      icon: MessageSquare },
  { to: "/feed",         label: "Syllabus",      icon: GraduationCap },
  { to: "/feed",         label: "Acad. Calendar",icon: CalendarDays },
  { to: "/profile/edit", label: "Settings",      icon: Settings2 },
  { to: "/feed",         label: "Bookmarks",     icon: Bookmark },
];

const Sidebar = () => {
  const { user, isAdmin, isClub } = useAuth();

  return (
    <div className="sticky top-20 space-y-2">
      {/* User mini card */}
      <Link to={`/profile/${user?.username}`}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group card card-lift block"
            style={{ textDecoration: "none" }}>
        <div className="relative shrink-0">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt={user?.username}
                 className="w-10 h-10 rounded-full object-cover"
                 style={{ border: "2.5px solid var(--p300)" }} />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                 style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", fontFamily: "Syne, sans-serif" }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          <span className="online-dot" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
            {user?.username}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--p400)" }}>@{user?.username}</p>
        </div>
        <span className="text-lg leading-none" style={{ color: "var(--tx-muted)" }}>···</span>
      </Link>

      {/* Main nav */}
      <div className="card py-2 overflow-hidden">
        <nav className="space-y-0.5 px-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "nav-active" : ""}`
              }
              style={({ isActive }) => ({
                color: isActive ? "var(--p600)" : "var(--tx)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              })}
              onMouseEnter={e => { if (!e.currentTarget.classList.contains("nav-active")) e.currentTarget.style.background = "var(--p50)"; }}
              onMouseLeave={e => { if (!e.currentTarget.classList.contains("nav-active")) e.currentTarget.style.background = "transparent"; }}>
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}

          {(isClub || isAdmin) && (
            <NavLink to="/events/create"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "nav-active" : ""}`
              }
              style={({ isActive }) => ({ color: isActive ? "var(--p600)" : "var(--tx)" })}
              onMouseEnter={e => { if (!e.currentTarget.classList.contains("nav-active")) e.currentTarget.style.background = "var(--p50)"; }}
              onMouseLeave={e => { if (!e.currentTarget.classList.contains("nav-active")) e.currentTarget.style.background = "transparent"; }}>
              <PlusCircle className="w-[18px] h-[18px]" />
              Create Event
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "nav-active" : ""}`
              }
              style={({ isActive }) => ({ color: isActive ? "var(--p600)" : "var(--tx)" })}
              onMouseEnter={e => { if (!e.currentTarget.classList.contains("nav-active")) e.currentTarget.style.background = "var(--p50)"; }}
              onMouseLeave={e => { if (!e.currentTarget.classList.contains("nav-active")) e.currentTarget.style.background = "transparent"; }}>
              <LayoutDashboard className="w-[18px] h-[18px]" />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="mx-4 my-2" style={{ height: "1px", background: "var(--border)" }} />

        <nav className="space-y-0.5 px-2">
          {EXTRA.map(({ to, label, icon: Icon }) => (
            <NavLink key={label} to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: "var(--tx)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Icon className="w-[18px] h-[18px]" style={{ color: "var(--tx-muted)" }} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Create post CTA */}
      <Link to="/feed"
            className="btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl text-sm w-full"
            style={{ textDecoration: "none" }}>
        <PlusCircle className="w-4 h-4" />
        Create post
      </Link>
    </div>
  );
};
export default Sidebar;
