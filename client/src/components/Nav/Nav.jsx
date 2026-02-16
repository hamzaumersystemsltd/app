// import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext.jsx";
// import "./Nav.css";
// import { toast } from "react-toastify";
// import { useEffect, useRef, useState } from "react";

// export default function Nav() {
//   const { pathname } = useLocation();
//   const { isAuthenticated, isAdmin, user, logout } = useAuth();
//   const navigate = useNavigate();

//   // --- Inventory dropdown ---
//   const [openInventory, setOpenInventory] = useState(false);
//   const inventoryRef = useRef(null);

//   // --- Vendor dropdown ---
//   const [openVendor, setOpenVendor] = useState(false);
//   const vendorRef = useRef(null);

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (inventoryRef.current && !inventoryRef.current.contains(e.target)) {
//         setOpenInventory(false);
//       }
//       if (vendorRef.current && !vendorRef.current.contains(e.target)) {
//         setOpenVendor(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Close dropdowns when route changes
//   useEffect(() => {
//     setOpenInventory(false);
//     setOpenVendor(false);
//   }, [pathname]);

//   const handleLogout = () => {
//     toast.info(
//       ({ closeToast }) => (
//         <div>
//           <strong>Are you sure you want to logout?</strong>
//           <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
//             <button
//               onClick={() => {
//                 closeToast();
//                 logout();
//                 toast.success("Logged out successfully.", { autoClose: 1500 });
//                 navigate("/login", { replace: true });
//               }}
//               style={{
//                 padding: "6px 10px",
//                 backgroundColor: "#d9534f",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: "4px",
//                 cursor: "pointer",
//               }}
//             >
//               Logout
//             </button>

//             <button
//               onClick={closeToast}
//               style={{
//                 padding: "6px 10px",
//                 backgroundColor: "#6c757d",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: "4px",
//                 cursor: "pointer",
//               }}
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       ),
//       { autoClose: false }
//     );
//   };

//   const inventoryActive = pathname.startsWith("/inventory");
//   const vendorActive = pathname.startsWith("/vendor");

//   return (
//     <header className="nav">
//       <div className="nav-inner">

//         {/* Brand */}
//         <Link
//           className="brand nav-link"
//           to={!isAuthenticated ? "/login" : "/"}
//           style={{ padding: 0, background: "transparent" }}
//         >
//           TechEra
//         </Link>

//         <div className="links">
//           {!isAuthenticated ? (
//             <>
//               <NavLink
//                 to="/login"
//                 className={({ isActive }) =>
//                   `nav-link ${isActive ? "active" : ""}`
//                 }
//               >
//                 Login
//               </NavLink>

//               <NavLink
//                 to="/register"
//                 className={({ isActive }) =>
//                   `nav-link ${isActive ? "active" : ""}`
//                 }
//               >
//                 Register
//               </NavLink>
//             </>
//           ) : (
//             <>
//               {/* Home */}
//               <NavLink
//                 to="/"
//                 end
//                 className={({ isActive }) =>
//                   `nav-link ${isActive ? "active" : ""}`
//                 }
//               >
//                 Home
//               </NavLink>

//               {/* Profile */}
//               <NavLink
//                 to="/profile"
//                 className={({ isActive }) =>
//                   `nav-link ${isActive ? "active" : ""}`
//                 }
//               >
//                 Profile
//               </NavLink>

//               {/* ADMIN ONLY DROPDOWNS */}
//               {isAdmin && (
//                 <>
//                   {/* INVENTORY DROPDOWN */}
//                   <div
//                     className={`dropdown ${inventoryActive ? "active" : ""}`}
//                     ref={inventoryRef}
//                     onMouseEnter={() => setOpenInventory(true)}
//                     onMouseLeave={() => setOpenInventory(false)}
//                   >
//                     <button
//                       className="nav-link dropdown-toggle"
//                       aria-haspopup="true"
//                       aria-expanded={openInventory}
//                       onClick={() => setOpenInventory(o => !o)}
//                     >
//                       Inventory
//                       <span className={`chevron ${openInventory ? "up" : "down"}`} />
//                     </button>

//                     <div
//                       className={`dropdown-menu ${openInventory ? "show" : ""}`}
//                       role="menu"
//                     >
//                       <NavLink
//                         to="/inventory/add-inventory"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Add Inventory
//                       </NavLink>

//                       <NavLink
//                         to="/inventory/inventory-list"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Inventory List
//                       </NavLink>

//                       <NavLink
//                         to="/inventory/purchase-invoice"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Purchase Invoice
//                       </NavLink>
//                     </div>
//                   </div>

//                   {/* VENDOR DROPDOWN */}
//                   <div
//                     className={`dropdown ${vendorActive ? "active" : ""}`}
//                     ref={vendorRef}
//                     onMouseEnter={() => setOpenVendor(true)}
//                     onMouseLeave={() => setOpenVendor(false)}
//                   >
//                     <button
//                       className="nav-link dropdown-toggle"
//                       aria-haspopup="true"
//                       aria-expanded={openVendor}
//                       onClick={() => setOpenVendor(o => !o)}
//                     >
//                       Vendor
//                       <span className={`chevron ${openVendor ? "up" : "down"}`} />
//                     </button>

//                     <div
//                       className={`dropdown-menu ${openVendor ? "show" : ""}`}
//                       role="menu"
//                     >
//                       <NavLink
//                         to="/vendor/add-vendor"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Add Vendor
//                       </NavLink>

//                       <NavLink
//                         to="/vendor/vendor-list"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Vendor List
//                       </NavLink>

//                     </div>
//                   </div>
//                 </>
//               )}

//               {/* Logout */}
//               <button className="logout-btn" onClick={handleLogout}>
//                 Logout
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }


// import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext.jsx";
// import "./Nav.css";
// import { toast } from "react-toastify";
// import { useEffect, useRef, useState } from "react";

// export default function Nav() {
//   const { pathname } = useLocation();
//   const { isAuthenticated, isAdmin, user, logout } = useAuth();
//   const navigate = useNavigate();

//   // --- Inventory dropdown ---
//   const [openInventory, setOpenInventory] = useState(false);
//   const inventoryRef = useRef(null);

//   // --- Vendor dropdown ---
//   const [openVendor, setOpenVendor] = useState(false);
//   const vendorRef = useRef(null);

//   // --- Account dropdown (avatar menu) ---
//   const [openAccount, setOpenAccount] = useState(false);
//   const accountRef = useRef(null);

//   // Close dropdowns when clicking outside
//   useEffect(() => {
//     function handleClickOutside(e) {
//       if (inventoryRef.current && !inventoryRef.current.contains(e.target)) {
//         setOpenInventory(false);
//       }
//       if (vendorRef.current && !vendorRef.current.contains(e.target)) {
//         setOpenVendor(false);
//       }
//       if (accountRef.current && !accountRef.current.contains(e.target)) {
//         setOpenAccount(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Close dropdowns when route changes
//   useEffect(() => {
//     setOpenInventory(false);
//     setOpenVendor(false);
//     setOpenAccount(false);
//   }, [pathname]);

//   const handleLogout = () => {
//     toast.info(
//       ({ closeToast }) => (
//         <div>
//           <strong>Are you sure you want to logout?</strong>
//           <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
//             <button
//               onClick={() => {
//                 closeToast();
//                 logout();
//                 toast.success("Logged out successfully.", { autoClose: 1500 });
//                 navigate("/login", { replace: true });
//               }}
//               style={{
//                 padding: "6px 10px",
//                 backgroundColor: "#d9534f",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: "4px",
//                 cursor: "pointer",
//               }}
//             >
//               Logout
//             </button>

//             <button
//               onClick={closeToast}
//               style={{
//                 padding: "6px 10px",
//                 backgroundColor: "#6c757d",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: "4px",
//                 cursor: "pointer",
//               }}
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       ),
//       { autoClose: false }
//     );
//   };

//   const inventoryActive = pathname.startsWith("/inventory");
//   const vendorActive = pathname.startsWith("/vendor");

//   // Utility to get initials if no avatar image
//   const getInitials = (nameOrEmail) => {
//     if (!nameOrEmail) return "U";
//     const name = (user?.name || nameOrEmail || "").trim();
//     if (!name) return "U";
//     const parts = name.split(" ").filter(Boolean);
//     if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//     return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//   };

//   const avatarUrl = user?.avatarUrl;

//   return (
//     <header className="nav">
//       <div className="nav-inner">
//         {/* Brand */}
//         <Link
//           className="brand nav-link"
//           to={!isAuthenticated ? "/login" : "/"}
//           style={{ padding: 0, background: "transparent" }}
//         >
//           TechEra
//         </Link>

//         <div className="links">
//           {!isAuthenticated ? (
//             <>
//               <NavLink
//                 to="/login"
//                 className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
//               >
//                 Login
//               </NavLink>

//               <NavLink
//                 to="/register"
//                 className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
//               >
//                 Register
//               </NavLink>
//             </>
//           ) : (
//             <>
//               {/* Home */}
//               <NavLink
//                 to="/"
//                 end
//                 className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
//               >
//                 Home
//               </NavLink>

//               {/* ADMIN ONLY DROPDOWNS */}
//               {isAdmin && (
//                 <>
//                   {/* INVENTORY DROPDOWN */}
//                   <div
//                     className={`dropdown ${inventoryActive ? "active" : ""}`}
//                     ref={inventoryRef}
//                     onMouseEnter={() => setOpenInventory(true)}
//                     onMouseLeave={() => setOpenInventory(false)}
//                   >
//                     <button
//                       className="nav-link dropdown-toggle"
//                       aria-haspopup="true"
//                       aria-expanded={openInventory}
//                       onClick={() => setOpenInventory((o) => !o)}
//                     >
//                       Inventory
//                       <span className={`chevron ${openInventory ? "up" : "down"}`} />
//                     </button>

//                     <div
//                       className={`dropdown-menu ${openInventory ? "show" : ""}`}
//                       role="menu"
//                     >
//                       <NavLink
//                         to="/inventory/add-inventory"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Add Inventory
//                       </NavLink>

//                       <NavLink
//                         to="/inventory/inventory-list"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Inventory List
//                       </NavLink>

//                       <NavLink
//                         to="/inventory/purchase-invoice"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Purchase Invoice
//                       </NavLink>
//                     </div>
//                   </div>

//                   {/* VENDOR DROPDOWN */}
//                   <div
//                     className={`dropdown ${vendorActive ? "active" : ""}`}
//                     ref={vendorRef}
//                     onMouseEnter={() => setOpenVendor(true)}
//                     onMouseLeave={() => setOpenVendor(false)}
//                   >
//                     <button
//                       className="nav-link dropdown-toggle"
//                       aria-haspopup="true"
//                       aria-expanded={openVendor}
//                       onClick={() => setOpenVendor((o) => !o)}
//                     >
//                       Vendor
//                       <span className={`chevron ${openVendor ? "up" : "down"}`} />
//                     </button>

//                     <div
//                       className={`dropdown-menu ${openVendor ? "show" : ""}`}
//                       role="menu"
//                     >
//                       <NavLink
//                         to="/vendor/add-vendor"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Add Vendor
//                       </NavLink>

//                       <NavLink
//                         to="/vendor/vendor-list"
//                         className={({ isActive }) =>
//                           `dropdown-item ${isActive ? "active" : ""}`
//                         }
//                       >
//                         Vendor List
//                       </NavLink>
//                     </div>
//                   </div>
//                 </>
//               )}

//               {/* --- ACCOUNT AVATAR MENU (replaces Logout button) --- */}
//               <div
//                 className={`dropdown account ${openAccount ? "open" : ""}`}
//                 ref={accountRef}
//                 onMouseEnter={() => setOpenAccount(true)}
//                 onMouseLeave={() => setOpenAccount(false)}
//               >
//                 <button
//                   className="avatar-btn"
//                   aria-label="User menu"
//                   aria-haspopup="true"
//                   aria-expanded={openAccount}
//                   onClick={() => setOpenAccount((o) => !o)} // tap support
//                 >
//                   {avatarUrl ? (
//                     <img
//                       src={avatarUrl}
//                       alt={user?.name || user?.email || "User"}
//                       className="avatar-img"
//                     />
//                   ) : (
//                     <span className="avatar-fallback">
//                       {getInitials(user?.name || user?.email)}
//                     </span>
//                   )}
//                 </button>

//                 <div
//                   className={`dropdown-menu right ${openAccount ? "show" : ""}`}
//                   role="menu"
//                 >
//                   <NavLink
//                     to="/profile"
//                     className={({ isActive }) =>
//                       `dropdown-item ${isActive ? "active" : ""}`
//                     }
//                   >
//                     Profile
//                   </NavLink>

//                   <NavLink
//                     to="/profile/edit"
//                     className={({ isActive }) =>
//                       `dropdown-item ${isActive ? "active" : ""}`
//                     }
//                   >
//                     Edit Profile
//                   </NavLink>

//                   <button className="dropdown-item danger" onClick={handleLogout}>
//                     Logout
//                   </button>
//                 </div>
//               </div>
//               {/* --- END ACCOUNT AVATAR MENU --- */}
//             </>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }

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

  // --- Account dropdown (avatar menu) ---
  const [openAccount, setOpenAccount] = useState(false);
  const accountRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (inventoryRef.current && !inventoryRef.current.contains(e.target)) {
        setOpenInventory(false);
      }
      if (vendorRef.current && !vendorRef.current.contains(e.target)) {
        setOpenVendor(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setOpenAccount(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdowns when route changes
  useEffect(() => {
    setOpenInventory(false);
    setOpenVendor(false);
    setOpenAccount(false);
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

  // Utility to get initials if no avatar image
  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return "U";
    const name = (user?.name || nameOrEmail || "").trim();
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarUrl = user?.avatarUrl; // adjust if your field is different

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
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
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
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Home
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
                      onClick={() => setOpenVendor((o) => !o)}
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

              {/* --- ACCOUNT AVATAR MENU --- */}
              <div
                className={`dropdown account ${openAccount ? "open" : ""}`}
                ref={accountRef}
                onMouseEnter={() => setOpenAccount(true)}
                onMouseLeave={() => setOpenAccount(false)}
              >
                <button
                  className="avatar-btn"
                  aria-label="User menu"
                  aria-haspopup="true"
                  aria-expanded={openAccount}
                  onClick={() => setOpenAccount((o) => !o)} // click support
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.name || user?.email || "User"}
                      className="avatar-img"
                    />
                  ) : (
                    <span className="avatar-fallback">
                      {getInitials(user?.name || user?.email)}
                    </span>
                  )}
                </button>

                <div
                  className={`dropdown-menu right ${openAccount ? "show" : ""}`}
                  role="menu"
                >
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    Profile
                  </NavLink>

                  <NavLink
                    to="/edit-profile"
                    className={({ isActive }) =>
                      `dropdown-item ${isActive ? "active" : ""}`
                    }
                  >
                    Edit Profile
                  </NavLink>

                  {/* Logout as TEXT (not a button) */}
                  <span
                    className="dropdown-item danger logout-text"
                    role="button"
                    tabIndex={0}
                    onClick={handleLogout}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleLogout();
                      }
                    }}
                  >
                    Logout
                  </span>
                </div>
              </div>
              {/* --- END ACCOUNT AVATAR MENU --- */}
            </>
          )}
        </div>
      </div>
    </header>
  );
}