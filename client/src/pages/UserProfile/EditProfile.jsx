import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import "./EditProfile.css";

// Reuse the same regex as Register.jsx
const nameRegex = /^[A-Za-z\s'-]+$/;
const passwordStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

// Password strength utility
function evaluatePasswordStrength(pw) {
  if (!pw) {
    return { score: 0, label: "Very Weak", color: "#d9534f", width: "0%" };
  }

  let score = 0;
  const lengthScore = pw.length >= 8 ? (pw.length >= 12 ? 2 : 1) : 0;
  const hasLower = /[a-z]/.test(pw) ? 1 : 0;
  const hasUpper = /[A-Z]/.test(pw) ? 1 : 0;
  const hasNumber = /\d/.test(pw) ? 1 : 0;
  const hasSpecial = /[^\w\s]/.test(pw) ? 1 : 0;

  score = lengthScore + hasLower + hasUpper + hasNumber + hasSpecial; // 0–6
  if (score > 5) score = 5;

  let label = "Very Weak";
  let color = "#d9534f";
  let width = `${(score / 5) * 100}%`;

  switch (true) {
    case score <= 1:
      label = "Very Weak";
      color = "#d9534f";
      break;
    case score === 2:
      label = "Weak";
      color = "#f0ad4e";
      break;
    case score === 3:
      label = "Fair";
      color = "#f0d54e";
      break;
    case score === 4:
      label = "Good";
      color = "#5cb85c";
      break;
    case score === 5:
      label = "Strong";
      color = "#2e8b57";
      break;
    default:
      break;
  }

  return { score, label, color, width };
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();

  const [newPw, setNewPw] = React.useState("");
  const strength = React.useMemo(() => evaluatePasswordStrength(newPw), [newPw]);

  // If page is not wrapped by a protected route, ensure redirect
  React.useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  if (!user) return <div className="profile-loading">Loading…</div>;

  const initialValues = {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    age: user.age ?? "",
    gender: user.gender || "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  };

  const EditSchema = Yup.object({
    firstName: Yup.string()
      .trim()
      .matches(nameRegex, "Only letters, spaces, hyphens, and apostrophes are allowed")
      .min(2, "Min 2 characters")
      .max(50, "Max 50 characters")
      .required("First name is required"),

    lastName: Yup.string()
      .trim()
      .matches(nameRegex, "Only letters, spaces, hyphens, and apostrophes are allowed")
      .min(2, "Min 2 characters")
      .max(50, "Max 50 characters")
      .required("Last name is required"),

    age: Yup.number()
      .typeError("Age must be a number")
      .integer("Age must be an integer")
      .min(13, "You must be at least 13")
      .max(120, "Please enter a valid age")
      .required("Age is required"),

    gender: Yup.mixed()
      .oneOf(["male", "female"], "Select gender")
      .required("Gender is required"),

    // Optional password change
    newPassword: Yup.string().test(
      "empty-or-strong",
      "Password must be 8+ chars and include uppercase, lowercase, number, and special char",
      (val) => !val || passwordStrongRegex.test(val)
    ),
    confirmNewPassword: Yup.string().oneOf(
      [Yup.ref("newPassword"), ""],
      "Passwords must match"
    ),
    currentPassword: Yup.string().when("newPassword", {
      is: (val) => !!val,
      then: (schema) => schema.required("Current password is required to set a new password"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        age: Number(values.age),
        gender: values.gender,
      };

      // Include password fields only if changing password
      if (values.newPassword) {
        payload.currentPassword = values.currentPassword;
        payload.newPassword = values.newPassword;
      }

      // Adjust endpoint if your backend differs
      const { data } = await axios.put(
        "http://localhost:5000/api/users/me",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Common response shapes
      const updatedUser = data?.user || data;
      const newToken = data?.token || token;

      // Update auth context + localStorage using your login(token, user) API
      if (updatedUser) login(newToken, updatedUser);

      toast.success("Profile updated successfully");
      resetForm({
        values: {
          ...values,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        },
      });
      setNewPw("");
      navigate("/profile", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">Edit Profile</h1>
        <p className="profile-subtitle">Update your personal information</p>

        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={EditSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              {/* First Name */}
              <div className="form-group">
                <label className="label" htmlFor="firstName">First name</label>
                <Field id="firstName" name="firstName" className="input" autoComplete="given-name" />
                <ErrorMessage name="firstName" component="div" className="message" />
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label className="label" htmlFor="lastName">Last name</label>
                <Field id="lastName" name="lastName" className="input" autoComplete="family-name" />
                <ErrorMessage name="lastName" component="div" className="message" />
              </div>

              {/* Email (read-only here) */}
              <div className="form-group">
                <label className="label" htmlFor="email">Email</label>
                <Field id="email" name="email" className="input" disabled />
                <div className="hint">Email cannot be changed here.</div>
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="label" htmlFor="gender">Gender</label>
                <Field as="select" id="gender" name="gender" className="input select">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Field>
                <ErrorMessage name="gender" component="div" className="message" />
              </div>

              {/* Age */}
              <div className="form-group">
                <label className="label" htmlFor="age">Age</label>
                <Field
                  id="age"
                  name="age"
                  type="number"
                  className="input"
                  min="13"
                  max="120"
                  inputMode="numeric"
                />
                <ErrorMessage name="age" component="div" className="message" />
              </div>

              {/* Optional password change */}
              <div className="divider">Change password (optional)</div>

              <div className="form-group">
                <label className="label" htmlFor="currentPassword">Current password</label>
                <Field
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  className="input"
                  autoComplete="current-password"
                />
                <ErrorMessage name="currentPassword" component="div" className="message" />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="newPassword">
                  New password (8+ chars, uppercase, lowercase, number, special)
                </label>
                <Field name="newPassword">
                  {({ field }) => (
                    <>
                      <input
                        id="newPassword"
                        type="password"
                        className="input"
                        autoComplete="new-password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setNewPw(e.target.value);
                        }}
                      />
                      <div className="pwd-strength">
                        <div
                          className="pwd-strength-bar"
                          style={{ width: strength.width, backgroundColor: strength.color }}
                        />
                      </div>
                      <div className="pwd-strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </div>
                    </>
                  )}
                </Field>
                <ErrorMessage name="newPassword" component="div" className="message" />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="confirmNewPassword">Confirm new password</label>
                <Field
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  className="input"
                  autoComplete="new-password"
                />
                <ErrorMessage name="confirmNewPassword" component="div" className="message" />
              </div>

              <div className="actions">
                <Link to="/profile" className="button button-secondary">Cancel</Link>
                <button className="button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}