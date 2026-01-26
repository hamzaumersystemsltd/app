import "./Home.css";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Home() {
  const { logout } = useAuth();
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
    <div className="home-page">
      <div className="home-card">
        <h1 className="home-title">Welcome to Homepage!</h1>
        <p className="home-subtitle">You are successfully logged in.</p>

        <div className="home-content">
          <p>
            This is a MERN app demonstrating a basic auth flow: register, login
            and protected homepage. Keep exploring or log out to test the flow again.
          </p>

          <span className="badge">Authenticated</span>
        </div>

        <div className="actions">
          <button className="button" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}