// client/src/components/layout/Sidebar.jsx
import { NavLink }          from "react-router-dom";
import { Home, Calendar,
         Users, Bookmark,
         LayoutDashboard,
         PlusCircle }       from "lucide-react";
import useAuth              from "@/hooks/useAuth";
import cn                   from "@/utils/cn";

const NAV = [
  { to: "/feed",   label: "Feed",   icon: Home },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/clubs",  label: "Clubs",  icon: Users },
];

const Sidebar = () => {
  const { user, isAdmin, isClub } = useAuth();

  return (
    <div className="sticky top-20 space-y-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition",
              isActive
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-600 hover:bg-gray-100"
            )
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}

      {/* Club/Admin — create event */}
      {(isClub || isAdmin) && (
        <NavLink
          to="/events/create"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition",
              isActive
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-600 hover:bg-gray-100"
            )
          }
        >
          <PlusCircle className="w-5 h-5" />
          Create Event
        </NavLink>
      )}

      {/* Admin dashboard */}
      {isAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition",
              isActive
                ? "bg-indigo-50 text-indigo-600"
                : "text-gray-600 hover:bg-gray-100"
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Admin
        </NavLink>
      )}

      {/* Profile quick link */}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <NavLink
          to={`/profile/${user?.username}`}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl
                     text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt={user?.username}
                 className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-100
                            flex items-center justify-center text-indigo-600
                            text-xs font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          )}
          {user?.username}
        </NavLink>
      </div>
    </div>
  );
};
export default Sidebar;