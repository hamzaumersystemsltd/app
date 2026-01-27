import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import React from "react";
import "./Register.css";
import { toast } from "react-toastify";

const nameRegex = /^[A-Za-z\s'-]+$/;
const passwordStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

// Password strength utility
function evaluatePasswordStrength(pw) {
  if (!pw) {
    return { score: 0, label: "Very Weak", color: "#d9534f", width: "0%" };
  }

  let score = 0;

  // Criteria
  const lengthScore = pw.length >= 8 ? (pw.length >= 12 ? 2 : 1) : 0;
  const hasLower = /[a-z]/.test(pw) ? 1 : 0;
  const hasUpper = /[A-Z]/.test(pw) ? 1 : 0;
  const hasNumber = /\d/.test(pw) ? 1 : 0;
  const hasSpecial = /[^\w\s]/.test(pw) ? 1 : 0;

  score = lengthScore + hasLower + hasUpper + hasNumber + hasSpecial; // 0–6

  // Normalize to 0–5 scale for UI
  if (score > 5) score = 5;

  let label = "Very Weak";
  let color = "#d9534f"; // red
  let width = `${(score / 5) * 100}%`;

  switch (true) {
    case score <= 1:
      label = "Very Weak";
      color = "#d9534f"; // red
      break;
    case score === 2:
      label = "Weak";
      color = "#f0ad4e"; // orange
      break;
    case score === 3:
      label = "Fair";
      color = "#f0d54e"; // yellow-ish
      break;
    case score === 4:
      label = "Good";
      color = "#5cb85c"; // green
      break;
    case score === 5:
      label = "Strong";
      color = "#2e8b57"; // darker green
      break;
    default:
      break;
  }

  return { score, label, color, width };
}

// Yup schema
const RegisterSchema = Yup.object({
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

  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .max(100, "Max 100 characters")
    .required("Email is required"),

  age: Yup.number()
    .typeError("Age must be a number")
    .integer("Age must be an integer")
    .min(13, "You must be at least 13")
    .max(120, "Please enter a valid age")
    .required("Age is required"),

  gender: Yup.mixed()
    .oneOf(["male", "female"], "Select gender")
    .required("Gender is required"),

  password: Yup.string()
    .required("Password is required")
    .matches(
      passwordStrongRegex,
      "Password must be 8+ chars and include uppercase, lowercase, number, and special char"
    ),

  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

export default function Register() {
  const navigate = useNavigate();
  const [passwordValue, setPasswordValue] = React.useState("");
  const strength = React.useMemo(() => evaluatePasswordStrength(passwordValue), [passwordValue]);

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-title">Create account</h2>
        <p className="register-subtitle">Fill in your details to sign up</p>

        <Formik
          initialValues={{
            firstName: "",
            lastName: "",
            email: "",
            age: "",
            gender: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={RegisterSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              const { firstName, lastName, email, age, gender, password } = values;

              const payload = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim().toLowerCase(),
                age: Number(age),
                gender,
                password,
              };

              await axios.post("http://localhost:5000/api/auth/register", payload);

              // ✅ SUCCESS TOAST WITH REDIRECT
              toast.success(
                ({ closeToast }) => (
                  <div>
                    <strong>Registration successful.</strong>
                    <br />
                    <button
                      onClick={() => {
                        closeToast();
                        navigate("/login", { replace: true });
                      }}
                      style={{
                        marginTop: "8px",
                        padding: "6px 10px",
                        backgroundColor: "#5cb85c",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Go to Login
                    </button>
                  </div>
                ),
                { autoClose: false }
              );

              resetForm();
              setPasswordValue("");
            } catch (e) {
              // ✅ ERROR TOAST
              toast.error(e.response?.data?.message || "Error registering.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              {/* First Name */}
              <div className="form-group">
                <label className="label" htmlFor="firstName">First name</label>
                <Field
                  id="firstName"
                  name="firstName"
                  className="input"
                  autoComplete="given-name"
                />
                <ErrorMessage name="firstName" component="div" className="message" />
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label className="label" htmlFor="lastName">Last name</label>
                <Field
                  id="lastName"
                  name="lastName"
                  className="input"
                  autoComplete="family-name"
                />
                <ErrorMessage name="lastName" component="div" className="message" />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="label" htmlFor="email">Email</label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  autoComplete="email"
                  inputMode="email"
                />
                <ErrorMessage name="email" component="div" className="message" />
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

              {/* Password */}
              <div className="form-group">
                <label className="label" htmlFor="password">Password (Must be 8+ chars and include uppercase, lowercase, number and special char.)</label>

                {/* Use Field render-props so we can intercept onChange and update strength */}
                <Field name="password">
                  {({ field }) => (
                    <>
                      <input
                        id="password"
                        type="password"
                        className="input"
                        autoComplete="new-password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e); // keep Formik in sync
                          setPasswordValue(e.target.value); // update local strength UI
                        }}
                      />

                      {/* Strength meter */}
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
                <ErrorMessage name="password" component="div" className="message" />
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="label" htmlFor="confirmPassword">Confirm password</label>
                <Field
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="input"
                  autoComplete="new-password"
                />
                <ErrorMessage name="confirmPassword" component="div" className="message" />
              </div>

              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="helper-row">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}