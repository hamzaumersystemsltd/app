import React from "react";
import { Formik, Form, useField } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import "./AddInventory.css";
import TextInput from "../../components/Form/TextInput.jsx";
import CurrencyInput from "../../components/Form/CurrencyInput.jsx";
import ImagePicker from "../../components/Form/ImagePicker.jsx";
import FormRow from "../../components/Form/FormRow.jsx";
import { FormActions } from "../../components/Form/FormActions.jsx";
import FieldWrapper from "../../components/Form/FieldWrapper.jsx";
import { currencyRegex } from "../../utils/validation.js";

export const API_BASE = "http://localhost:5000";

export async function checkItemCodeAvailable(code, token) {
  if (!code) return true;
  try {
    const res = await axios.get(`${API_BASE}/api/inventory/check-code`, {
      params: { code },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return !!res.data?.available;
  } catch (err) {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      toast.error("Not authorized to check item code. Please log in as admin.");
    }
    return true;
  }
}

export const InventorySchema = Yup.object({
  itemCode: Yup.string()
    .required("Item code is required")
    .matches(/^\d{5}$/, "Item code must be exactly 5 digits (e.g., 00001)"),
  name: Yup.string().trim().min(2, "Min 2 characters").max(100, "Max 100 characters").required("Name is required"),
  category: Yup.string().trim().min(2, "Min 2 characters").max(50, "Max 50 characters").required("Category is required"),
  wsPrice: Yup.string().required("Wholesale price is required").matches(currencyRegex, "Enter a valid amount (e.g., 10.00)"),
  rtPrice: Yup.string().required("Retail price is required").matches(currencyRegex, "Enter a valid amount (e.g., 10.00)"),
  costPrice: Yup.string().required("Cost price is required").matches(currencyRegex, "Enter a valid amount (e.g., 10.00)"),
  stockQuantity: Yup.number().typeError("Enter a valid number").integer("Must be an integer").min(0, "Must be ≥ 0").required("Stock is required"),
  description: Yup.string().trim().max(500, "Max 500 characters"),
}).test(
  "price-logic",
  "Retail should be ≥ wholesale and wholesale ≥ cost",
  (values) => {
    const ws = Number(values.wsPrice);
    const rt = Number(values.rtPrice);
    const cost = Number(values.costPrice);
    if (Number.isNaN(ws) || Number.isNaN(rt) || Number.isNaN(cost)) return true;
    return rt >= ws && ws >= cost;
  }
);

function TextAreaInput({ name, label, ...props }) {
  const [field] = useField(name);
  return (
    <FieldWrapper name={name} label={label}>
      <textarea id={name} className="input" rows={3} {...field} {...props} />
    </FieldWrapper>
  );
}

export default function InventoryForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Item",
  enableReinitialize = false,
  validateOnChange = false,
  token,
  existingImage = null,
}) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={InventorySchema}
      validateOnBlur
      validateOnChange={validateOnChange}
      onSubmit={onSubmit}
      enableReinitialize={enableReinitialize}
    >
      {({ isSubmitting, setFieldValue, setFieldError }) => (
        <Form className="addinventory-form">
          <div className="addinventory-layout">
            {/* LEFT SIDE */}
            <div className="form-left">
              {/* Name */}
              <TextInput name="name" label="Name" />

              {/* Row: itemCode, category, stock */}
              <FormRow>
                <TextInput
                  name="itemCode"
                  label="Item Code"
                  maxLength={5}
                  inputMode="numeric"
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D+/g, "").slice(0, 5);
                    setFieldValue("itemCode", onlyDigits);
                  }}
                  onBlur={async (e) => {
                    // Keep Formik blur behavior
                    const v = (e.target.value || "").trim();
                    if (!/^\d{5}$/.test(v)) return;
                    const available = await checkItemCodeAvailable(v, token);
                    if (!available) setFieldError("itemCode", "Item code already exists");
                  }}
                />

                <TextInput name="category" label="Category" />

                <TextInput
                  name="stockQuantity"
                  label="Stock"
                  inputMode="numeric"
                />
              </FormRow>

              {/* Prices */}
              <FormRow>
                <CurrencyInput name="wsPrice" label="Wholesale" />
                <CurrencyInput name="rtPrice" label="Retail" />
                <CurrencyInput name="costPrice" label="Cost" />
              </FormRow>

              {/* Description */}
              <TextAreaInput name="description" label="Description" />

              {/* Submit */}
              <FormActions isSubmitting={isSubmitting} label={submitLabel} />
            </div>

            {/* RIGHT SIDE - IMAGE */}
            <div className="form-right">
              <div className="image-panel">
                <ImagePicker
                  name="imageFile"
                  label="Product Image"
                  existingUrl={existingImage}
                  placeholder="Click to upload image"
                />
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}