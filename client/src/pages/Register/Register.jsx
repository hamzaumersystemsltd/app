import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import React from "react";
import "./Register.css";
import { toast } from "react-toastify";
import TextInput from "../../components/Form/TextInput.jsx";
import PasswordInput from "../../components/Form/PasswordInput.jsx";
import SelectInput from "../../components/Form/SelectInput.jsx";
import FormRow from "../../components/Form/FormRow.jsx";
import { FormActions } from "../../components/Form/FormActions.jsx";
import { nameRegex, passwordStrongRegex } from "../../utils/validation.js";

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
            } catch (e) {
              // ERROR TOAST
              toast.error(e.response?.data?.message || "Error registering.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              {/* First & Last Name */}
              <FormRow cols="two">
                <TextInput
                  name="firstName"
                  label="First name"
                  autoComplete="given-name"
                />
                <TextInput
                  name="lastName"
                  label="Last name"
                  autoComplete="family-name"
                />
              </FormRow>

              {/* Email */}
              <TextInput
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                inputMode="email"
              />

              {/* Gender & Age */}
              <FormRow cols="two">
                <SelectInput
                  name="gender"
                  label="Gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                />
                <TextInput
                  name="age"
                  label="Age"
                  type="number"
                  min="13"
                  max="120"
                  inputMode="numeric"
                />
              </FormRow>

              {/* Passwords */}
              <PasswordInput
                name="password"
                label="Password (Must be 8+ chars and include uppercase, lowercase, number and special char.)"
                autoComplete="new-password"
                showStrength
              />
              <PasswordInput
                name="confirmPassword"
                label="Confirm password"
                autoComplete="new-password"
              />

              {/* Submit */}
              <FormActions isSubmitting={isSubmitting} label="Register" />
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