import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Nav.css";
import { toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";

export default function Nav() {
  const { pathname } = useLocation();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  // --- Inventory dropdown ---
  const [openInventory, setOpenInventory] = useState(false);
  const inventoryRef = useRef(null);

  // --- Vendor dropdown ---
  const [openVendor, setOpenVendor] = useState(false);
  const vendorRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (inventoryRef.current && !inventoryRef.current.contains(e.target)) {
        setOpenInventory(false);
      }
      if (vendorRef.current && !vendorRef.current.contains(e.target)) {
        setOpenVendor(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdowns when route changes
  useEffect(() => {
    setOpenInventory(false);
    setOpenVendor(false);
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

  const inventoryActive = pathname.startsWith("/inventory");
  const vendorActive = pathname.startsWith("/vendor");

  return (
    <header className="nav">
      <div className="nav-inner">

        {/* Brand */}
        <Link
          className="brand nav-link"
          to={!isAuthenticated ? "/login" : "/"}
          style={{ padding: 0, background: "transparent" }}
        >
          TechEra
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

              {/* Profile */}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                Profile
              </NavLink>

              {/* ADMIN ONLY DROPDOWNS */}
              {isAdmin && (
                <>
                  {/* INVENTORY DROPDOWN */}
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
                      onClick={() => setOpenInventory(o => !o)}
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
                      >
                        Add Inventory
                      </NavLink>

                      <NavLink
                        to="/inventory/inventory-list"
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? "active" : ""}`
                        }
                      >
                        Inventory List
                      </NavLink>

                      <NavLink
                        to="/inventory/purchase-invoice"
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? "active" : ""}`
                        }
                      >
                        Purchase Invoice
                      </NavLink>
                    </div>
                  </div>

                  {/* VENDOR DROPDOWN */}
                  <div
                    className={`dropdown ${vendorActive ? "active" : ""}`}
                    ref={vendorRef}
                    onMouseEnter={() => setOpenVendor(true)}
                    onMouseLeave={() => setOpenVendor(false)}
                  >
                    <button
                      className="nav-link dropdown-toggle"
                      aria-haspopup="true"
                      aria-expanded={openVendor}
                      onClick={() => setOpenVendor(o => !o)}
                    >
                      Vendor
                      <span className={`chevron ${openVendor ? "up" : "down"}`} />
                    </button>

                    <div
                      className={`dropdown-menu ${openVendor ? "show" : ""}`}
                      role="menu"
                    >
                      <NavLink
                        to="/vendor/add-vendor"
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? "active" : ""}`
                        }
                      >
                        Add Vendor
                      </NavLink>

                      <NavLink
                        to="/vendor/vendor-list"
                        className={({ isActive }) =>
                          `dropdown-item ${isActive ? "active" : ""}`
                        }
                      >
                        Vendor List
                      </NavLink>

                    </div>
                  </div>
                </>
              )}

              {/* Logout */}
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