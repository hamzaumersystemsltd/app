import { useAuth } from "../context/AuthContext.jsx";
import "./UserProfile.css";

const UserProfile = () => {
  const { user } = useAuth();

  if (!user) return <div className="profile-loading">Loading…</div>;

  const { firstName, lastName, email, age, gender, role } = user;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">Personal information</p>

        <div className="profile-info">
          <Row label="First name" value={firstName} />
          <Row label="Last name" value={lastName} />
          <Row label="Email" value={email} />
          <Row label="Age" value={age} />
          <Row label="Gender" value={gender} />
          <Row label="Role" value={role} />
        </div>
      </div>
    </div>
  );
};

function Row({ label, value }) {
  return (
    <div className="profile-row">
      <div className="profile-label">{label}</div>
      <div className="profile-value">{value ?? "—"}</div>
    </div>
  );
}

export default UserProfile;