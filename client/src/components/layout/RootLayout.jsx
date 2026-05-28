// client/src/components/layout/RootLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar     from "./Navbar";
import Sidebar    from "./Sidebar";
import useNotifications from "@/hooks/useNotifications";

const RootLayout = () => {
  useNotifications();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", position: "relative", zIndex: 1 }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-8 flex gap-5">
        {/* Left sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <Sidebar />
        </aside>
        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default RootLayout;
