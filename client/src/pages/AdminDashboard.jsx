import { useAuth } from "../context/AuthContext.jsx";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();

  if (!user) return <div className="admin-loading">Loading…</div>;

  const { firstName, lastName, email, age, gender } = user;

  return (
    <div className="admin-page">
      <div className="admin-card">
        <h1 className="admin-title">Admin Profile</h1>
        <p className="admin-subtitle">Your account details</p>

        <div className="admin-info">
          <Row label="First name" value={firstName} />
          <Row label="Last name" value={lastName} />
          <Row label="Email" value={email} />
          <Row label="Age" value={age} />
          <Row label="Gender" value={gender} />
        </div>
      </div>
    </div>
  );
};

function Row({ label, value }) {
  return (
    <div className="admin-row">
      <div className="admin-label">{label}</div>
      <div className="admin-value">{value ?? "—"}</div>
    </div>
  );
}

export default AdminDashboard;