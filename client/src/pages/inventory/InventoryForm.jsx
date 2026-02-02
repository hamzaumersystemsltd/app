import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import "./AddInventory.css";

// ---- Shared constants/utilities (exported) ----
export const API_BASE = "http://localhost:5000";
export const currencyRegex = /^(?:\d+(?:\.\d{1,2})?)$/; // integers or up to 2 decimals

// Async check for duplicate item code (protected route: requires token)
export async function checkItemCodeAvailable(code, token) {
  if (!code) return true;
  try {
    const res = await axios.get(`${API_BASE}/api/inventory/check-code`, {
      params: { code },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return !!res.data?.available;
  } catch (err) {
    // If the check fails (network/auth), don't block the user here;
    // backend will still enforce uniqueness on submit.
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      toast.error("Not authorized to check item code. Please log in as admin.");
    }
    return true;
  }
}

// --- Validation Schema (no meta fields on frontend) ---
export const InventorySchema = Yup.object({
  itemCode: Yup.string()
    .trim()
    .min(2, "Min 2 characters")
    .max(30, "Max 30 characters")
    .required("Item code is required")
    .test(
      "no-spaces",
      "No spaces allowed in item code",
      (v) => (v ?? "").trim() === (v ?? "").replace(/\s+/g, "")
    ),
  name: Yup.string()
    .trim()
    .min(2, "Min 2 characters")
    .max(100, "Max 100 characters")
    .required("Name is required"),
  category: Yup.string()
    .trim()
    .min(2, "Min 2 characters")
    .max(50, "Max 50 characters")
    .required("Category is required"),

  wsPrice: Yup.string()
    .required("Wholesale price is required")
    .matches(currencyRegex, "Enter a valid amount (e.g., 100 or 100.50)"),
  rtPrice: Yup.string()
    .required("Retail price is required")
    .matches(currencyRegex, "Enter a valid amount (e.g., 100 or 100.50)"),
  costPrice: Yup.string()
    .required("Cost price is required")
    .matches(currencyRegex, "Enter a valid amount (e.g., 100 or 100.50)"),

  stockQuantity: Yup.number()
    .typeError("Stock quantity must be a number")
    .integer("Stock quantity must be an integer")
    .min(0, "Stock quantity cannot be negative")
    .required("Stock quantity is required"),

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

export default function InventoryForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Item",
  enableReinitialize = false,
  validateOnChange = false,
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
      {({ isSubmitting }) => (
        <Form>
          {/* 1) Name (full-width at the top) */}
          <div className="form-group">
            <label className="label" htmlFor="name">Name</label>
            <Field id="name" name="name" className="input" />
            <ErrorMessage name="name" component="div" className="message" />
          </div>

          {/* 2) Single line: Item Code, Category, Stock Quantity */}
          <div className="form-row">
            <div className="form-group">
              <label className="label" htmlFor="itemCode">Item Code (unique)</label>
              <Field
                id="itemCode"
                name="itemCode"
                className="input"
                placeholder="e.g., SKU-001"
              />
              <ErrorMessage name="itemCode" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="category">Category</label>
              <Field
                id="category"
                name="category"
                className="input"
                placeholder="e.g., Grocery"
              />
              <ErrorMessage name="category" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="stockQuantity">Stock Quantity</label>
              <Field
                id="stockQuantity"
                name="stockQuantity"
                className="input"
                inputMode="numeric"
                placeholder="e.g., 100"
              />
              <ErrorMessage name="stockQuantity" component="div" className="message" />
            </div>
          </div>

          {/* 3) Prices (single line) */}
          <div className="form-row">
            <div className="form-group">
              <label className="label" htmlFor="wsPrice">Wholesale (WS) Price</label>
              <Field
                id="wsPrice"
                name="wsPrice"
                className="input"
                inputMode="decimal"
                placeholder="e.g., 500 or 500.00"
              />
              <ErrorMessage name="wsPrice" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="rtPrice">Retail (RT) Price</label>
              <Field
                id="rtPrice"
                name="rtPrice"
                className="input"
                inputMode="decimal"
                placeholder="e.g., 650 or 650.00"
              />
              <ErrorMessage name="rtPrice" component="div" className="message" />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="costPrice">Cost Price</label>
              <Field
                id="costPrice"
                name="costPrice"
                className="input"
                inputMode="decimal"
                placeholder="e.g., 450 or 450.00"
              />
              <ErrorMessage name="costPrice" component="div" className="message" />
            </div>
          </div>

          {/* 4) Description */}
          <div className="form-group">
            <label className="label" htmlFor="description">Description (optional)</label>
            <Field
              id="description"
              name="description"
              as="textarea"
              className="input"
              placeholder="Enter an optional description of the item (max 500 characters)"
            />
            <ErrorMessage name="description" component="div" className="message" />
          </div>

          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </Form>
      )}
    </Formik>
  );
}