// client/src/components/layout/RootLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar     from "./Navbar";
import Sidebar    from "./Sidebar";
import useNotifications from "@/hooks/useNotifications";

const RootLayout = () => {
  useNotifications(); // real-time toast + badge updates

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-8 flex gap-6">
        {/* Left sidebar — hidden on mobile */}
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