import React, { useEffect, useMemo, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import "./EditProfile.css";

// Regex
const nameRegex = /^[A-Za-z\s'-]+$/;
const passwordStrongRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

// Placeholder
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
            fill='#9ca3af' font-size='14' font-family='sans-serif'>No Image</text>
    </svg>`
  );

// Password strength meter
function evaluatePasswordStrength(pw) {
  if (!pw) return { score: 0, label: "Very Weak", color: "#d9534f", width: "0%" };

  let score = 0;
  const lengthScore = pw.length >= 12 ? 2 : pw.length >= 8 ? 1 : 0;
  score =
    lengthScore +
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/\d/.test(pw) ? 1 : 0) +
    (/[^\w\s]/.test(pw) ? 1 : 0);

  if (score > 5) score = 5;

  const map = {
    1: ["Very Weak", "#d9534f"],
    2: ["Weak", "#f0ad4e"],
    3: ["Fair", "#f0d54e"],
    4: ["Good", "#5cb85c"],
    5: ["Strong", "#2e8b57"],
  };

  const [label, color] = map[score] || ["Very Weak", "#d9534f"];
  return { score, label, color, width: `${(score / 5) * 100}%` };
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();

  const [newPw, setNewPw] = useState("");
  const strength = useMemo(() => evaluatePasswordStrength(newPw), [newPw]);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  if (!user) return <h3 className="text-center mt-4">Loading…</h3>;

  // Initial values
  const initialValues = {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    age: user.age ?? "",
    gender: user.gender || "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    profileImage: null,
  };

  // Yup validation
  const EditSchema = Yup.object({
    firstName: Yup.string()
      .trim()
      .matches(nameRegex, "Only letters, spaces, hyphens, and apostrophes allowed")
      .min(2)
      .max(50)
      .required("First name is required"),

    lastName: Yup.string()
      .trim()
      .matches(nameRegex, "Only letters, spaces, hyphens, and apostrophes allowed")
      .min(2)
      .max(50)
      .required("Last name is required"),

    age: Yup.number().integer().min(13).max(120).required("Age is required"),

    gender: Yup.string().oneOf(["male", "female"]).required("Gender is required"),

    newPassword: Yup.string().test(
      "empty-or-strong",
      "Password must be 8+ chars, including uppercase, lowercase, number, special char",
      (val) => !val || passwordStrongRegex.test(val)
    ),

    confirmNewPassword: Yup.string().oneOf(
      [Yup.ref("newPassword"), ""],
      "Passwords must match"
    ),

    currentPassword: Yup.string().when("newPassword", {
      is: (val) => !!val,
      then: (s) => s.required("Current password is required"),
    }),
  });

  // Submit handler
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const fd = new FormData();
      fd.append("firstName", values.firstName.trim());
      fd.append("lastName", values.lastName.trim());
      fd.append("age", String(values.age));
      fd.append("gender", values.gender);

      if (values.newPassword) {
        fd.append("currentPassword", values.currentPassword);
        fd.append("newPassword", values.newPassword);
      }

      if (values.profileImage instanceof File) {
        fd.append("profileImage", values.profileImage);
      }

      const { data } = await axios.put(
        "http://localhost:5000/api/users/me",
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = data?.user || data;
      const newToken = data?.token || token;

      if (updatedUser) login(newToken, updatedUser);

      toast.success("Profile updated!");

      resetForm({
        values: {
          ...values,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
          profileImage: null,
        },
      });
      setNewPw("");

      navigate("/profile");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="addinventory-page">
      <div className="addinventory-card">
        <h3 className="addinventory-title">Edit Profile</h3>
        <p className="addinventory-subtitle">Update your personal information</p>

        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={EditSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, setFieldValue, setFieldError }) => {
            const fileRef = useRef(null);

            const handleImageChange = (e) => {
              const file = e.currentTarget.files?.[0];
              if (!file) return setFieldValue("profileImage", null);
              if (!file.type.startsWith("image/"))
                return setFieldError("profileImage", "Only image files allowed");
              if (file.size > 5 * 1024 * 1024)
                return setFieldError("profileImage", "Max size 5MB");

              setFieldValue("profileImage", file);
            };

            const previewImage =
              values.profileImage instanceof File
                ? URL.createObjectURL(values.profileImage)
                : user.profileImage || PLACEHOLDER_IMG;

            return (
              <Form className="addinventory-form">
                <div className="addinventory-layout">

                  {/* LEFT SIDE */}
                  <div className="form-left">

                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">First Name</label>
                        <Field name="firstName" className="input" />
                        <ErrorMessage name="firstName" className="message" component="div" />
                      </div>

                      <div className="form-group">
                        <label className="label">Last Name</label>
                        <Field name="lastName" className="input" />
                        <ErrorMessage name="lastName" className="message" component="div" />
                      </div>

                      <div className="form-group">
                        <label className="label">Email</label>
                        <Field name="email" className="input" disabled />
                        <div className="hint">Email cannot be changed</div>
                      </div>
                    </div>

                    <div className="form-row two">
                      <div className="form-group">
                        <label className="label">Gender</label>
                        <Field as="select" name="gender" className="input select">
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </Field>
                        <ErrorMessage name="gender" className="message" component="div" />
                      </div>

                      <div className="form-group">
                        <label className="label">Age</label>
                        <Field name="age" type="number" className="input" />
                        <ErrorMessage name="age" className="message" component="div" />
                      </div>
                    </div>

                    <div className="divider">Change Password (Optional)</div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">Current Password</label>
                        <Field type="password" name="currentPassword" className="input" />
                        <ErrorMessage name="currentPassword" className="message" component="div" />
                      </div>

                      <div className="form-group">
                        <label className="label">New Password</label>

                        <Field name="newPassword">
                          {({ field }) => (
                            <>
                              <input
                                {...field}
                                type="password"
                                className="input"
                                onChange={(e) => {
                                  field.onChange(e);
                                  setNewPw(e.target.value);
                                }}
                              />

                              <div className="pwd-strength">
                                <div
                                  className="pwd-strength-bar"
                                  style={{
                                    width: strength.width,
                                    backgroundColor: strength.color,
                                  }}
                                />
                              </div>
                              <div
                                className="pwd-strength-label"
                                style={{ color: strength.color }}
                              >
                                {strength.label}
                              </div>
                            </>
                          )}
                        </Field>

                        <ErrorMessage name="newPassword" className="message" component="div" />
                      </div>

                      <div className="form-group">
                        <label className="label">Confirm New Password</label>
                        <Field
                          type="password"
                          name="confirmNewPassword"
                          className="input"
                        />
                        <ErrorMessage name="confirmNewPassword" className="message" component="div" />
                      </div>
                    </div>

                    <button className="button" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>

                  {/* RIGHT SIDE — IMAGE */}
                  <div className="form-right">
                    <div className="image-panel">
                      <label className="label">Profile Image</label>

                      <input
                        type="file"
                        accept="image/*"
                        ref={fileRef}
                        className="hidden-file-input"
                        onChange={handleImageChange}
                      />

                      <div className="image-preview" onClick={() => fileRef.current.click()}>
                        <img src={previewImage} className="preview-img" alt="Preview" />
                      </div>
                    </div>
                  </div>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}