// client/src/components/layout/Navbar.jsx
import { Link, useNavigate }    from "react-router-dom";
import { useState }             from "react";
import { Search, LogOut, User, Settings, PenSquare, Sparkles } from "lucide-react";
import { useSelector }          from "react-redux";
import useAuth                  from "@/hooks/useAuth";
import useDebounce              from "@/hooks/useDebounce";
import { selectCurrentUser }    from "@/store/slices/authSlice";
import NotifBell from "@/components/notifications/NotifBell";

const Navbar = () => {
  const { logout }            = useAuth();
  const user                  = useSelector(selectCurrentUser);
  const navigate              = useNavigate();
  const [search, setSearch]   = useState("");
  const [dropOpen, setDrop]   = useState(false);
  const debouncedSearch       = useDebounce(search, 400);

  const handleSearch = (e) => {
    e.preventDefault();
    if (debouncedSearch.trim())
      navigate(`/feed?q=${encodeURIComponent(debouncedSearch.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 glass"
         style={{ borderBottom: "1.5px solid var(--border)" }}>
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">

        {/* Logo */}
        <Link to="/feed" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
               style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
            <span className="text-white font-bold text-base relative z-10"
                  style={{ fontFamily: "Syne, sans-serif" }}>B</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style={{ background: "linear-gradient(135deg, #6b21d8, #9333ea)" }} />
          </div>
          <span className="text-lg font-bold hidden sm:block"
                style={{ fontFamily: "Syne, sans-serif", color: "var(--tx-h)" }}>
            BitConnect
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-lg mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "var(--p400)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators, projects, events..."
              className="input-base w-full pl-10 pr-4 py-2.5 text-sm"
              style={{ borderRadius: "99px" }}
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {/* Create button */}
          <Link to="/events/create"
                className="btn-primary hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Create
          </Link>

          {/* Notification bell */}
          <NotifBell />

          {/* Avatar + dropdown */}
          <div className="relative">
            <button onClick={() => setDrop((p) => !p)}
                    className="rounded-full transition-transform hover:scale-105 active:scale-95"
                    style={{ padding: "2px" }}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.username}
                     className="w-9 h-9 rounded-full object-cover"
                     style={{ border: "2.5px solid var(--p300)" }} />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                     style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", fontFamily: "Syne, sans-serif" }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </button>

            {dropOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDrop(false)} />
                <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl overflow-hidden shadow-2xl scale-in"
                     style={{ background: "#fff", border: "1.5px solid var(--border)" }}>
                  <div className="px-4 py-3.5"
                       style={{ background: "linear-gradient(135deg, var(--p50), var(--p100))", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2.5">
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt=""
                             className="w-8 h-8 rounded-full object-cover"
                             style={{ border: "2px solid var(--p300)" }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                             style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                          {user?.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--tx-h)", fontFamily: "Syne, sans-serif" }}>
                          {user?.username}
                        </p>
                        <p className="text-xs capitalize" style={{ color: "var(--p500)" }}>{user?.role}</p>
                      </div>
                    </div>
                  </div>
                  {[
                    { to: `/profile/${user?.username}`, icon: User,     label: "My Profile" },
                    { to: "/profile/edit",              icon: Settings,  label: "Settings"   },
                  ].map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to} onClick={() => setDrop(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                          style={{ color: "var(--tx)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--p50)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <Icon className="w-4 h-4" style={{ color: "var(--p400)" }} />
                      {label}
                    </Link>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    <button onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: "var(--danger)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
