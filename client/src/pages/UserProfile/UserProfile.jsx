import { useAuth } from "../../context/AuthContext.jsx";
import "./UserProfile.css";

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
            fill='#9ca3af' font-size='14' font-family='sans-serif'>No Image</text>
    </svg>`
  );

const UserProfile = () => {
  const { user } = useAuth();
  if (!user) return <div className="profile-loading">Loading…</div>;

  const { firstName, lastName, email, age, gender, role, profileImage } = user;
  const imgSrc = profileImage || PLACEHOLDER_IMG;

  return (
    <div className="profile-full-page">

      {/* Header */}
      <div className="profile-header">
        <div>
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Personal information</p>
        </div>

        <img
          src={imgSrc}
          alt={`${firstName} ${lastName} profile photo`}
          className="profile-header-image"
          onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
        />
      </div>

      {/* Info Table */}
      <div className="profile-info-table">
        <Row label="First name" value={firstName} />
        <Row label="Last name" value={lastName} />
        <Row label="Email" value={email} />
        <Row label="Age" value={age} />
        <Row label="Gender" value={gender} />
        <Row label="Role" value={role} />
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