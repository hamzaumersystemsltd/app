import React, { useMemo, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import "./AddInventory.css";

// ---- Shared constants/utilities (exported) ----
export const API_BASE = "http://localhost:5000";
export const currencyRegex = /^(?:\d+(?:\.\d{1,2})?)$/;

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
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      toast.error("Not authorized to check item code. Please log in as admin.");
    }
    return true;
  }
}

// --- Validation Schema (unchanged) ---
export const InventorySchema = Yup.object({
  itemCode: Yup.string()
    .required("Item code is required")
    .matches(/^\d{5}$/, "Item code must be exactly 5 digits (e.g., 00001)"),
  name: Yup.string().trim().min(2).max(100).required("Name is required"),
  category: Yup.string().trim().min(2).max(50).required("Category is required"),
  wsPrice: Yup.string().required().matches(currencyRegex),
  rtPrice: Yup.string().required().matches(currencyRegex),
  costPrice: Yup.string().required().matches(currencyRegex),
  stockQuantity: Yup.number().typeError().integer().min(0).required(),
  description: Yup.string().trim().max(500),
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
  token,
  existingImage = null,
}) {
  const fileInputRef = useRef(null);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={InventorySchema}
      validateOnBlur
      validateOnChange={validateOnChange}
      onSubmit={onSubmit}
      enableReinitialize={enableReinitialize}
    >
      {({ isSubmitting, setFieldValue, values, setFieldError, handleBlur }) => {
        // Updated preview logic:
        const previewUrl = useMemo(() => {
          if (values.imageFile instanceof File) {
            return URL.createObjectURL(values.imageFile);
          }
          if (existingImage) return existingImage;
          return null;
        }, [values.imageFile, existingImage]);

        useEffect(() => {
          return () => {
            if (previewUrl && values.imageFile instanceof File) {
              URL.revokeObjectURL(previewUrl);
            }
          };
        }, [previewUrl, values.imageFile]);

        const handleImageChange = (e) => {
          const file = e.currentTarget.files?.[0];
          if (!file) {
            setFieldValue("imageFile", null);
            return;
          }
          if (!file.type.startsWith("image/")) {
            setFieldError("imageFile", "Only image files are allowed");
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            setFieldError("imageFile", "Image must be ≤ 5MB");
            return;
          }
          setFieldValue("imageFile", file);
        };

        const openFileDialog = () => fileInputRef.current?.click();

        return (
          <Form className="addinventory-form">
            <div className="addinventory-layout">
              {/* LEFT SIDE */}
              <div className="form-left">

                {/* Name */}
                <div className="form-group">
                  <label className="label">Name</label>
                  <Field name="name" className="input" />
                  <ErrorMessage name="name" className="message" component="div" />
                </div>

                {/* Row: itemCode, category, stock */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Item Code</label>
                    <Field name="itemCode">
                      {({ field }) => (
                        <input
                          {...field}
                          className="input"
                          maxLength={5}
                          inputMode="numeric"
                          onChange={(e) => {
                            const onlyDigits = e.target.value.replace(/\D+/g, "").slice(0, 5);
                            setFieldValue("itemCode", onlyDigits);
                          }}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="itemCode" className="message" component="div" />
                  </div>

                  <div className="form-group">
                    <label className="label">Category</label>
                    <Field name="category" className="input" />
                    <ErrorMessage name="category" className="message" component="div" />
                  </div>

                  <div className="form-group">
                    <label className="label">Stock</label>
                    <Field name="stockQuantity" className="input" />
                    <ErrorMessage name="stockQuantity" className="message" component="div" />
                  </div>
                </div>

                {/* Prices */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Wholesale</label>
                    <Field name="wsPrice" className="input" />
                    <ErrorMessage name="wsPrice" component="div" className="message" />
                  </div>
                  <div className="form-group">
                    <label className="label">Retail</label>
                    <Field name="rtPrice" className="input" />
                    <ErrorMessage name="rtPrice" component="div" className="message" />
                  </div>
                  <div className="form-group">
                    <label className="label">Cost</label>
                    <Field name="costPrice" className="input" />
                    <ErrorMessage name="costPrice" component="div" className="message" />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="label">Description</label>
                  <Field as="textarea" name="description" className="input" />
                  <ErrorMessage name="description" className="message" component="div" />
                </div>

                {/* Submit */}
                <button className="button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : submitLabel}
                </button>
              </div>

              {/* RIGHT SIDE - IMAGE */}
              <div className="form-right">
                <div className="image-panel">
                  <label className="label">Product Image</label>

                  {/* Hidden input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden-file-input"
                    onChange={handleImageChange}
                  />

                  {/* Clickable Preview */}
                  <div className="image-preview" onClick={openFileDialog}>
                    {previewUrl ? (
                      <img src={previewUrl} className="preview-img" alt="Preview" />
                    ) : (
                      <div className="preview-placeholder">Click to upload image</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}