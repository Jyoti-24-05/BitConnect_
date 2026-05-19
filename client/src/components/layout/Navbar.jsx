// client/src/components/layout/Navbar.jsx
import { Link, useNavigate }    from "react-router-dom";
import { useState }             from "react";
import { Bell, Search, Menu,
         X, LogOut, User,
         Settings }             from "lucide-react";
import { useSelector }          from "react-redux";
import useAuth                  from "@/hooks/useAuth";
import useDebounce              from "@/hooks/useDebounce";
import { selectCurrentUser }    from "@/store/slices/authSlice";
import cn                       from "@/utils/cn";
import NotifBell from "@/components/notifications/NotifBell";

const Navbar = () => {
  const { logout }            = useAuth();
  const user                  = useSelector(selectCurrentUser);
  const navigate              = useNavigate();
  const [search, setSearch]   = useState("");
  const [menuOpen, setMenu]   = useState(false);
  const [dropOpen, setDrop]   = useState(false);
  const debouncedSearch       = useDebounce(search, 400);
  const unreadCount           = useSelector((s) => s.notifs.unreadCount);

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
    <nav className="fixed top-0 inset-x-0 z-50 h-16 bg-white border-b border-gray-200
                    flex items-center px-4 gap-4">

      {/* Logo */}
      <Link to="/feed"
            className="text-xl font-bold text-indigo-600 shrink-0">
        BitConnect
      </Link>

      {/* Search */}
      <form onSubmit={handleSearch}
            className="hidden sm:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts, events, clubs..."
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm
                       outline-none focus:ring-2 focus:ring-indigo-300
                       focus:bg-white transition"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-3">
        {/* Notification bell */}
        <NotifBell />

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setDrop((p) => !p)}
            className="flex items-center gap-2 focus:outline-none"
          >
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.username}
                   className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100
                              flex items-center justify-center text-indigo-600
                              font-semibold text-sm">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </button>

          {dropOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10"
                   onClick={() => setDrop(false)} />
              <div className="absolute right-0 top-10 z-20 w-52
                              bg-white rounded-xl shadow-lg border border-gray-100
                              overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-sm text-gray-900">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <Link
                  to={`/profile/${user?.username}`}
                  onClick={() => setDrop(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm
                             text-gray-700 hover:bg-gray-50 transition"
                >
                  <User className="w-4 h-4" /> Profile
                </Link>
                <Link
                  to="/profile/edit"
                  onClick={() => setDrop(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm
                             text-gray-700 hover:bg-gray-50 transition"
                >
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                             text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenu((p) => !p)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </nav>
  );
};
export default Navbar;