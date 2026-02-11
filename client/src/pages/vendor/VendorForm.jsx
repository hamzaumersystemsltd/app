import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import "./AddVendor.css";

export const API_BASE = "http://localhost:5000";

export async function checkVendorIdAvailable(vendorId, token) {
  if (!vendorId) return true;
  try {
    const res = await axios.get(`${API_BASE}/api/vendors/check-id`, {
      params: { vendorId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return !!res.data?.available;
  } catch (err) {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      toast.error("Not authorized to check vendor ID. Please log in as admin.");
    }
    return true;
  }
}

const phoneRegex = /^[0-9+\-()\s]{7,20}$/;

export const VendorSchema = Yup.object({
  vendorId: Yup.string()
    .required("Vendor ID is required")
    .matches(/^\d{5}$/, "Vendor ID must be exactly 5 digits (e.g., 00001)"),
  name: Yup.string()
    .trim()
    .min(2, "Min 2 characters")
    .max(100, "Max 100 characters")
    .required("Vendor name is required"),
  companyName: Yup.string().trim().max(100, "Max 100 characters"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email (e.g., user@example.com)")
    .max(100, "Max 100 characters"),
  phone: Yup.string()
    .trim()
    .matches(phoneRegex, "Enter a valid phone number")
    .max(20, "Max 20 characters"),
  address: Yup.string().trim().max(200, "Max 200 characters"),
  city: Yup.string().trim().max(50, "Max 50 characters"),
  country: Yup.string().trim().max(50, "Max 50 characters"),
  contactPerson: Yup.string().trim().max(100, "Max 100 characters"),
  status: Yup.string().oneOf(["active", "inactive"], "Invalid status").default("active"),
});

export default function VendorForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Vendor",
  enableReinitialize = false,
  validateOnChange = false,
  token,
}) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={VendorSchema}
      validateOnBlur
      validateOnChange={validateOnChange}
      onSubmit={onSubmit}
      enableReinitialize={enableReinitialize}
    >
      {({ isSubmitting, setFieldError, handleBlur }) => (
        <Form>
          {/* 1) Name */}
          <div className="form-group">
            <label className="label" htmlFor="name">Name</label>
            <Field id="name" name="name" className="input" />
            <ErrorMessage name="name" component="div" className="message" />
          </div>

          {/* 2) Vendor ID (unique), Company Name */}
          <div className="form-row">
            <div className="form-group">
              <label className="label" htmlFor="vendorId">Vendor ID</label>

              <Field name="vendorId">
                {({ field, form }) => (
                  <input
                    id="vendorId"
                    {...field}
                    className="input"
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D+/g, "").slice(0, 5);
                      form.setFieldValue("vendorId", onlyDigits);
                    }}
                    onBlur={async (e) => {
                      handleBlur(e);
                      const v = (e.target.value || "").trim();
                      if (!/^\d{5}$/.test(v)) return;
                      const available = await checkVendorIdAvailable(v, token);
                      if (!available) {
                        setFieldError("vendorId", "Vendor ID already exists");
                      }
                    }}
                  />
                )}
              </Field>

              <ErrorMessage name="vendorId" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="companyName">Company Name</label>
              <Field id="companyName" name="companyName" className="input" />
              <ErrorMessage name="companyName" component="div" className="message" />
            </div>
          </div>

          {/* 3) Contact Info */}
          <div className="form-row">
            <div className="form-group">
              <label className="label" htmlFor="email">Email</label>
              <Field id="email" name="email" type="email" className="input" />
              <ErrorMessage name="email" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="phone">Phone</label>
              <Field id="phone" name="phone" className="input" />
              <ErrorMessage name="phone" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="contactPerson">Contact Person</label>
              <Field id="contactPerson" name="contactPerson" className="input" />
              <ErrorMessage name="contactPerson" component="div" className="message" />
            </div>
          </div>

          {/* 4) Address */}
          <div className="form-group">
            <label className="label" htmlFor="address">Address</label>
            <Field id="address" name="address" as="textarea" className="input" />
            <ErrorMessage name="address" component="div" className="message" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label" htmlFor="city">City</label>
              <Field id="city" name="city" className="input" />
              <ErrorMessage name="city" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="country">Country</label>
              <Field id="country" name="country" className="input" />
              <ErrorMessage name="country" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="status">Status</label>
              <Field as="select" id="status" name="status" className="input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Field>
              <ErrorMessage name="status" component="div" className="message" />
            </div>
          </div>

          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </Form>
      )}
    </Formik>
  );
}