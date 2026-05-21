// client/src/context/AuthContext.jsx 
import {
  createContext, useState,
  useEffect, useCallback, useRef,
} from "react";
import { useDispatch }   from "react-redux";
import { authApi }       from "@/api/authApi";
import {
  setCredentials,
  clearCredentials,
}                        from "@/store/slices/authSlice";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch              = useDispatch();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const calledRef             = useRef(false);

  useEffect(() => {
    // Hard guard — only ever runs once
    if (calledRef.current) return;
    calledRef.current = true;

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const { data: r } = await authApi.refresh();
        if (cancelled) return;

        window.__accessToken__ = r.data.accessToken;
        const { data: m }      = await authApi.getMe();
        if (cancelled) return;

        setUser(m.data);
        dispatch(setCredentials({
          user:        m.data,
          accessToken: r.data.accessToken,
        }));
      } catch {
        if (cancelled) return;
        // No cookie = no session = normal for guests
        window.__accessToken__ = null;
        setUser(null);
        dispatch(clearCredentials());
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []); // empty deps — runs once only

  const login = useCallback(async (credentials) => {
    const { data }                      = await authApi.login(credentials);
    const { user: u, accessToken: tok } = data.data;
    window.__accessToken__              = tok;
    setUser(u);
    dispatch(setCredentials({ user: u, accessToken: tok }));
    return u;
  }, [dispatch]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    window.__accessToken__ = null;
    setUser(null);
    dispatch(clearCredentials());
  }, [dispatch]);

  const updateUser = useCallback((fields) => {
    setUser((prev) => {
      const next = { ...prev, ...fields };
      dispatch(setCredentials({
        user:        next,
        accessToken: window.__accessToken__,
      }));
      return next;
    });
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{
      user, loading,
      isLoggedIn: !!user,
      isAdmin:    user?.role === "admin",
      isClub:     user?.role === "club",
      login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};