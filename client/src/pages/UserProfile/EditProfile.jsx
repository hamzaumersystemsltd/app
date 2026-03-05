import React, { useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import "./EditProfile.css";
import TextInput from "../../components/Form/TextInput.jsx";
import PasswordInput from "../../components/Form/PasswordInput.jsx";
import SelectInput from "../../components/Form/SelectInput.jsx";
import ImagePicker from "../../components/Form/ImagePicker.jsx";
import FormRow from "../../components/Form/FormRow.jsx";
import { FormActions } from "../../components/Form/FormActions.jsx";
import { nameRegex, passwordStrongRegex } from "../../utils/validation.js";

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
            fill='#9ca3af' font-size='14' font-family='sans-serif'>No Image</text>
    </svg>`
  );

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  if (!user) return <h3 className="text-center mt-4">Loading…</h3>;

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

      const { data } = await axios.put("http://localhost:5000/api/users/me", fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

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
          {({ isSubmitting }) => (
            <Form className="addinventory-form">
              <div className="addinventory-layout">
                {/* LEFT SIDE */}
                <div className="form-left">
                  <FormRow>
                    <TextInput name="firstName" label="First Name" />
                    <TextInput name="lastName" label="Last Name" />
                    <TextInput
                      name="email"
                      label="Email"
                      disabled
                      hint="Email cannot be changed"
                    />
                  </FormRow>

                  <FormRow cols="two">
                    <SelectInput
                      name="gender"
                      label="Gender"
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                      ]}
                    />
                    <TextInput name="age" label="Age" type="number" />
                  </FormRow>

                  <div className="divider">Change Password (Optional)</div>

                  <FormRow>
                    <PasswordInput
                      name="currentPassword"
                      label="Current Password"
                    />
                    <PasswordInput
                      name="newPassword"
                      label="New Password"
                      showStrength
                    />
                    <PasswordInput
                      name="confirmNewPassword"
                      label="Confirm New Password"
                    />
                  </FormRow>

                  <FormActions isSubmitting={isSubmitting} label="Save Changes" />
                </div>

                {/* RIGHT SIDE — IMAGE */}
                <div className="form-right">
                  <div className="image-panel">
                    <ImagePicker
                      name="profileImage"
                      label="Profile Image"
                      existingUrl={user.profileImage || PLACEHOLDER_IMG}
                    />
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}