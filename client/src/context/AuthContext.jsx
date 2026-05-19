// client/src/context/AuthContext.jsx
import {
  createContext, useState,
  useEffect, useCallback,
} from "react";
import { useDispatch }     from "react-redux";
import { authApi }         from "@/api/authApi";
import {
  setCredentials,
  clearCredentials,
}                          from "@/store/slices/authSlice";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch              = useDispatch();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try refresh — only works if httpOnly cookie exists
        const { data: refreshData } = await authApi.refresh();
        const accessToken           = refreshData.data.accessToken;
        window.__accessToken__      = accessToken;

        // Fetch user profile
        const { data: meData } = await authApi.getMe();
        const currentUser      = meData.data;

        setUser(currentUser);
        dispatch(setCredentials({ user: currentUser, accessToken }));
      } catch {
        // No session — expected for logged-out users
        window.__accessToken__ = null;
        setUser(null);
        dispatch(clearCredentials());
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []); // runs once on mount only

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    const { user: loggedInUser, accessToken } = data.data;

    window.__accessToken__ = accessToken;
    setUser(loggedInUser);
    dispatch(setCredentials({ user: loggedInUser, accessToken }));

    return loggedInUser;
  }, [dispatch]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue logout even if request fails
    } finally {
      window.__accessToken__ = null;
      setUser(null);
      dispatch(clearCredentials());
    }
  }, [dispatch]);

  // ── Update user fields locally ─────────────────────────────────────────────
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      dispatch(setCredentials({
        user:        updated,
        accessToken: window.__accessToken__,
      }));
      return updated;
    });
  }, [dispatch]);

  const value = {
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin:    user?.role === "admin",
    isClub:     user?.role === "club",
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};