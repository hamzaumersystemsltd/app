import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ✅ Block login/register for logged-in users */
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default PublicRoute;