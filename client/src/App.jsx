// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider }  from "@/context/SocketContext";
import useAuth             from "@/hooks/useAuth";

// Layouts
import RootLayout          from "@/components/layout/RootLayout";
import ProtectedRoute      from "@/components/layout/ProtectedRoute";

// Auth pages
import LoginPage           from "@/pages/auth/LoginPage";
import RegisterPage        from "@/pages/auth/RegisterPage";
import ForgotPasswordPage  from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage   from "@/pages/auth/ResetPasswordPage";
import OAuthCallbackPage   from "@/pages/auth/OAuthCallbackPage";

// App pages
import FeedPage            from "@/pages/feed/FeedPage";
import PostDetailPage      from "@/pages/feed/PostDetailPage";
import EventsPage          from "@/pages/events/EventsPage";
import EventDetailPage     from "@/pages/events/EventDetailPage";
import CreateEventPage     from "@/pages/events/CreateEventPage";
import ClubsPage           from "@/pages/clubs/ClubsPage";
import ClubDetailPage      from "@/pages/clubs/ClubDetailPage";
import CreateClubPage      from "@/pages/clubs/CreateClubPage";
import ProfilePage         from "@/pages/profile/ProfilePage";
import EditProfilePage     from "@/pages/profile/EditProfilePage";
import AdminDashboard      from "@/pages/admin/AdminDashboard";
import NotFoundPage        from "@/pages/NotFoundPage";

// Socket wrapper — only mounts socket when user is logged in
const SocketWrapper = ({ children }) => {
  const { user } = useAuth();
  return (
    <SocketProvider accessToken={window.__accessToken__}>
      {children}
    </SocketProvider>
  );
};

const App = () => {
  const { loading } = useAuth();

  // Block render until session restore completes — prevents flash of login page
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <SocketWrapper>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/register"       element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

          {/* Protected app routes — all inside RootLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RootLayout />}>
              <Route index                      element={<Navigate to="/feed" replace />} />
              <Route path="/feed"               element={<FeedPage />} />
              <Route path="/posts/:postId"      element={<PostDetailPage />} />
              <Route path="/events"             element={<EventsPage />} />
              <Route path="/events/create"      element={<CreateEventPage />} />
              <Route path="/events/:eventId"    element={<EventDetailPage />} />
              <Route path="/clubs"              element={<ClubsPage />} />
              <Route path="/clubs/create"       element={<CreateClubPage />} />
              <Route path="/clubs/:slug"        element={<ClubDetailPage />} />
              <Route path="/profile/:username"  element={<ProfilePage />} />
              <Route path="/profile/edit"       element={<EditProfilePage />} />

              {/* Admin only */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SocketWrapper>
    </BrowserRouter>
  );
};

export default App;