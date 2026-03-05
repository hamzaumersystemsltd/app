import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Login.css";
import { toast } from "react-toastify";
import { useState } from "react";
import ForgotPasswordDialog from "../../components/ForgotPassword/ForgotPasswordDialog.jsx";
import TextInput from "../../components/Form/TextInput.jsx";
import PasswordInput from "../../components/Form/PasswordInput.jsx";
import { FormActions } from "../../components/Form/FormActions.jsx";

const LoginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),
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

              login(res.data.token, res.data.user);

              toast.success("Login successful.", { autoClose: 2000 });

              navigate("/", { replace: true });
            } catch (e) {
              toast.error(e.response?.data?.message || "Invalid email or password.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              {/* Email */}
              <TextInput
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                inputMode="email"
              />

              {/* Password + Forgot Link */}
              <div className="form-group">
                <PasswordInput
                  name="password"
                  label="Password"
                  autoComplete="current-password"
                />
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

              {/* Submit */}
              <FormActions isSubmitting={isSubmitting} label="Login" />
            </Form>
          )}
        </Formik>

        <div className="helper-row">
          Don’t have an account? <Link to="/register">Register</Link>
        </div>
      </div>

      {showForgot && (
        <ForgotPasswordDialog onClose={() => setShowForgot(false)} />
      )}
    </div>
  );
}