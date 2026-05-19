// client/src/pages/NotFoundPage.jsx
import { Link } from "react-router-dom";
const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <h1 className="text-6xl font-bold text-indigo-600">404</h1>
    <p className="text-gray-500">Page not found</p>
    <Link to="/feed" className="text-indigo-600 hover:underline text-sm">
      Go to feed →
    </Link>
  </div>
);
export default NotFoundPage;