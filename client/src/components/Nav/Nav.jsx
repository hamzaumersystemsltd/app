import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Nav.css";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";

export default function Nav() {
  const { pathname } = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  // --- Dropdown state for Inventory
  const [openInventory, setOpenInventory] = useState(false);
  const inventoryRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (inventoryRef.current && !inventoryRef.current.contains(e.target)) {
        setOpenInventory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setOpenInventory(false);
  }, [pathname]);

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

  const inventoryActive =
    pathname.startsWith("/inventory");

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

              {/* Profile (all users) */}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Profile
              </NavLink>

              {/* Admin only */}
              {isAdmin && (
                <>
                  {/* Inventory as dropdown */}
                  <div
                    className={`dropdown ${inventoryActive ? "active" : ""}`}
                    ref={inventoryRef}
                    onMouseEnter={() => setOpenInventory(true)}
                    onMouseLeave={() => setOpenInventory(false)}
                  >
                    <button
                      className="nav-link dropdown-toggle"
                      aria-haspopup="true"
                      aria-expanded={openInventory}
                      onClick={() => setOpenInventory((o) => !o)}
                    >
                      Inventory
                      <span className={`chevron ${openInventory ? "up" : "down"}`} />
                    </button>

                    <div
                      className={`dropdown-menu ${openInventory ? "show" : ""}`}
                      role="menu"
                    >
                      <NavLink
                        to="/inventory/add-inventory"
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? "active" : ""}`
                        }
                        role="menuitem"
                      >
                        Add Inventory
                      </NavLink>

                      <NavLink
                        to="/inventory/inventory-list"
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? "active" : ""}`
                        }
                        role="menuitem"
                      >
                        Inventory List
                      </NavLink>

                      <NavLink
                        to="/inventory/purchase-invoice"
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? "active" : ""}`
                        }
                        role="menuitem"
                      >
                        Purchase Invoice
                      </NavLink>
                    </div>
                  </div>
                </>
              )}

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