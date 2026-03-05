import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import "./AddVendor.css";
import TextInput from "../../components/Form/TextInput.jsx";
import SelectInput from "../../components/Form/SelectInput.jsx";
import FormRow from "../../components/Form/FormRow.jsx";
import { FormActions } from "../../components/Form/FormActions.jsx";
import FieldWrapper from "../../components/Form/FieldWrapper.jsx";
import { phoneRegex } from "../../utils/validation.js";

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

function TextAreaInput({ name, label, rows = 3, ...props }) {
  return (
    <FieldWrapper name={name} label={label}>
      <textarea id={name} className="input" rows={rows} name={name} {...props} />
    </FieldWrapper>
  );
}

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
      {({ isSubmitting, setFieldValue, setFieldError }) => (
        <Form>
          {/* 1) Name, Vendor ID (unique), Company Name */}
          <FormRow>
            <TextInput id="name" name="name" label="Name" />

            <TextInput
              id="vendorId"
              name="vendorId"
              label="Vendor ID"
              inputMode="numeric"
              maxLength={5}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D+/g, "").slice(0, 5);
                setFieldValue("vendorId", onlyDigits);
              }}
              onBlur={async (e) => {
                const v = (e.target.value || "").trim();
                if (!/^\d{5}$/.test(v)) return;
                const available = await checkVendorIdAvailable(v, token);
                if (!available) setFieldError("vendorId", "Vendor ID already exists");
              }}
            />

            <TextInput
              id="companyName"
              name="companyName"
              label="Company Name"
            />
          </FormRow>

          {/* 2) Contact Info */}
          <FormRow>
            <TextInput id="email" name="email" type="email" label="Email" />
            <TextInput id="phone" name="phone" label="Phone" />
            <TextInput
              id="contactPerson"
              name="contactPerson"
              label="Contact Person"
            />
          </FormRow>

          {/* 3) Location & Status */}
          <FormRow>
            <TextInput id="city" name="city" label="City" />
            <TextInput id="country" name="country" label="Country" />
            <SelectInput
              id="status"
              name="status"
              label="Status"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </FormRow>

          {/* 4) Address */}
          <TextAreaInput name="address" label="Address" rows={3} />

          {/* Submit */}
          <FormActions isSubmitting={isSubmitting} label={submitLabel} />
        </Form>
      )}
    </Formik>
  );
}