import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";
import { toast } from "react-toastify";
import { useState } from "react";
import ForgotPasswordDialog from "../components/ForgotPasswordDialog.jsx";

const LoginSchema = Yup.object({
  email: Yup.string().trim().email("Enter a valid email address").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showForgot, setShowForgot] = useState(false);

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Sign in</h2>
        <p className="login-subtitle">Enter your credentials to continue</p>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const res = await axios.post("http://localhost:5000/api/auth/login", {
                email: values.email.trim().toLowerCase(),
                password: values.password,
              });

              // Save token
              login(res.data.token);

              // Success toast, then navigate
              toast.success("Login successful ✅", {
                onClose: () => navigate("/", { replace: true }),
                autoClose: 2000,
              });
            } catch (e) {
              toast.error(e.response?.data?.message || "❌ Invalid email or password");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              {/* Email */}
              <div className="form-group">
                <label className="label" htmlFor="email">Email</label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  placeholder="e.g. hamza@example.com"
                  autoComplete="email"
                  inputMode="email"
                />
                <ErrorMessage name="email" component="div" className="message" />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="label" htmlFor="password">Password</label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  className="input"
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <ErrorMessage name="password" component="div" className="message" />

                <div className="helper-row">
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setShowForgot(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="helper-row">
          Don’t have an account? <Link to="/register">Register</Link>
        </div>
      </div>

      {showForgot && <ForgotPasswordDialog onClose={() => setShowForgot(false)} />}
    </div>
  );
}