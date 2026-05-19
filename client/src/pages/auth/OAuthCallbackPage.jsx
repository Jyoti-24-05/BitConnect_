// client/src/pages/auth/OAuthCallbackPage.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { authApi } from "@/api/authApi";

// Landing page after Google / GitHub OAuth redirect
// URL: /oauth/callback?token=<accessToken>
const OAuthCallbackPage = () => {
  const navigate          = useNavigate();
  const dispatch          = useDispatch();
  const [params]          = useSearchParams();

  useEffect(() => {
    const handle = async () => {
      const token = params.get("token");
      if (!token) return navigate("/login");

      // Store access token in memory
      window.__accessToken__ = token;

      try {
        const { data } = await authApi.getMe();
        dispatch(setCredentials({ user: data.data, accessToken: token }));
        navigate("/feed");
      } catch {
        navigate("/login?error=oauth_failed");
      }
    };
    handle();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent
                        rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
};
export default OAuthCallbackPage;