import { useEffect, useRef, useState, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import "./ForgotPasswordDialog.css";

const passwordStrongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

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
  let color = "#d9534f"; // red
  const width = `${(score / 5) * 100}%`;

  switch (true) {
    case score <= 1:
      label = "Very Weak";
      color = "#d9534f";
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

/* === Schemas === */
const EmailSchema = Yup.object({
  email: Yup.string().trim().email("Enter a valid email address").required("Email is required"),
});

const OtpSchema = Yup.object({
  code: Yup.string().trim().matches(/^\d{6}$/, "Enter the 6-digit code").required("Code is required"),
});

const ResetSchema = Yup.object({
  newPassword: Yup.string()
    .required("New password is required")
    .matches(
      passwordStrongRegex,
      "Password must be 8+ chars and include uppercase, lowercase, number, and special char"
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords do not match")
    .required("Confirm your password"),
});

export default function ForgotPasswordDialog({ onClose }) {
  const [stage, setStage] = useState("email"); // 'email' | 'otp' | 'reset'
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const timerRef = useRef(null);

  // Local state for password strength UI (reset stage)
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const strength = useMemo(
    () => evaluatePasswordStrength(newPasswordValue),
    [newPasswordValue]
  );

  // Countdown management for retryAfter
  useEffect(() => {
    if (!retryAfter) return;
    timerRef.current = setInterval(() => {
      setRetryAfter((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [retryAfter]);

  return (
    <div className="dialog-backdrop">
      <div className="dialog-card">
        <div className="dialog-header">
          <h3>Reset your password</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Stage 1: Request Code */}
        {stage === "email" && (
          <Formik
            initialValues={{ email: "" }}
            validationSchema={EmailSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await axios.post("http://localhost:5000/api/auth/forgot-password", {
                  email: values.email.trim().toLowerCase(),
                });
                setEmail(values.email.trim().toLowerCase());
                toast.info("If the email exists, a 6-digit code has been sent.");
                setStage("otp");
              } catch (e) {
                const retry = e.response?.data?.retryAfter;
                if (retry) {
                  setRetryAfter(retry);
                  toast.warn(`Code already sent. Try again in ${retry} seconds.`);
                } else {
                  toast.error(e.response?.data?.message || "Unable to send code");
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form-group">
                  <label className="label" htmlFor="fp-email">Email</label>
                  <Field
                    id="fp-email"
                    name="email"
                    type="email"
                    className="input"
                    autoComplete="email"
                    inputMode="email"
                  />
                  <ErrorMessage name="email" component="div" className="message" />
                </div>
                <button className="button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send code"}
                </button>
              </Form>
            )}
          </Formik>
        )}

        {/* Stage 2: Verify OTP */}
        {stage === "otp" && (
          <>
            <p className="hint">Enter the 6‑digit code sent to <b>{email}</b>.</p>
            <Formik
              initialValues={{ code: "" }}
              validationSchema={OtpSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
                    email,
                    code: values.code.trim(),
                  });
                  setResetToken(res.data.resetToken);
                  toast.success("Code verified");
                  setStage("reset");
                } catch (e) {
                  toast.error(e.response?.data?.message || "Invalid or expired code");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="form-group">
                    <label className="label" htmlFor="fp-code">Security code</label>
                    <Field
                      id="fp-code"
                      name="code"
                      type="text"
                      inputMode="numeric"
                      className="input"
                    />
                    <ErrorMessage name="code" component="div" className="message" />
                  </div>

                  <div className="row-between">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={async () => {
                        try {
                          await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
                          toast.info("If the email exists, a new code has been sent.");
                        } catch (e) {
                          const retry = e.response?.data?.retryAfter;
                          if (retry) {
                            setRetryAfter(retry);
                            toast.warn(`Code already sent. Try again in ${retry} seconds.`);
                          } else {
                            toast.error(e.response?.data?.message || "Unable to resend code");
                          }
                        }
                      }}
                      disabled={retryAfter > 0}
                    >
                      {retryAfter > 0 ? `Resend in ${retryAfter}s` : "Resend code"}
                    </button>

                    <button className="button" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </>
        )}

        {/* Stage 3: Reset Password (with strength meter + strong validation) */}
        {stage === "reset" && (
          <Formik
            initialValues={{ newPassword: "", confirmPassword: "" }}
            validationSchema={ResetSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                await axios.post("http://localhost:5000/api/auth/reset-password", {
                  resetToken,
                  newPassword: values.newPassword,
                });
                toast.success("Password reset successful. You can now sign in.");
                resetForm();
                setNewPasswordValue("");
                onClose();
              } catch (e) {
                toast.error(e.response?.data?.message || "Unable to reset password");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form-group">
                  <label className="label" htmlFor="fp-new">
                    New password{" "}
                    <span className="subtle">
                      (8+ chars, must include uppercase, lowercase, number & special char)
                    </span>
                  </label>

                  {/* Use Field render-props to update strength UI and keep Formik in sync */}
                  <Field name="newPassword">
                    {({ field }) => (
                      <>
                        <input
                          id="fp-new"
                          type="password"
                          className="input"
                          autoComplete="new-password"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);          // keep Formik value in sync
                            setNewPasswordValue(e.target.value); // update local strength state
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

                  <ErrorMessage name="newPassword" component="div" className="message" />
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="fp-confirm">Confirm password</label>
                  <Field
                    id="fp-confirm"
                    name="confirmPassword"
                    type="password"
                    className="input"
                    autoComplete="new-password"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="message" />
                </div>

                <button className="button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Update password"}
                </button>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
}