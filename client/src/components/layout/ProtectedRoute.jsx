// client/src/components/layout/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import useAuth              from "@/hooks/useAuth";

const ProtectedRoute = ({ requiredRole }) => {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (requiredRole && user?.role !== requiredRole)
    return <Navigate to="/feed" replace />;

  return <Outlet />;
};
export default ProtectedRoute;