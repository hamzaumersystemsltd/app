import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Nav.css";
import { toast } from "react-toastify";

export default function Nav() {
  const { pathname } = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <strong>Are you sure you want to logout?</strong>
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                closeToast();
                logout();
                toast.success("Logged out successfully.", { autoClose: 1500 });
                navigate("/login", { replace: true });
              }}
              style={{
                padding: "6px 10px",
                backgroundColor: "#d9534f",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>

            <button
              onClick={closeToast}
              style={{
                padding: "6px 10px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { autoClose: false }
    );
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        {/* Brand */}
        <Link
          className="brand nav-link"
          to={!isAuthenticated ? "/login" : "/"}
          style={{ padding: 0, background: "transparent" }}
        >
          MERN Project
        </Link>

        <div className="links">
          {!isAuthenticated ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Register
              </NavLink>
            </>
          ) : (
            <>
              {/* Home */}
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Home
              </NavLink>

              {/* ✅ Profile (all users) */}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Profile
              </NavLink>

              {/* ✅ Admin only */}
              {/* {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `nav-link ${
                      isActive || pathname.startsWith("/admin") ? "active" : ""
                    }`
                  }
                >
                  Admin
                </NavLink>
              )} */}

              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}