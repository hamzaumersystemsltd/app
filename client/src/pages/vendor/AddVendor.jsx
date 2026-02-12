import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import VendorForm, {
  API_BASE,
  checkVendorIdAvailable,
} from "./VendorForm";
import "./AddVendor.css";

export default function AddVendor({ authToken }) {
  const token =
    authToken ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const initialValues = {
    vendorId: "",
    name: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    contactPerson: "",
    status: "active",
  };

  const handleAdd = async (
    values,
    { setSubmitting, resetForm, setFieldError }
  ) => {
    try {
      if (!token) {
        toast.error("Not authorized. Please log in.");
        setSubmitting(false);
        return;
      }

      const available = await checkVendorIdAvailable(
        values.vendorId.trim(),
        token
      );
      if (!available) {
        setFieldError("vendorId", "This vendor ID already exists");
        setSubmitting(false);
        return;
      }

      const payload = {
        vendorId: values.vendorId.trim(),
        name: values.name.trim(),
        companyName: values.companyName.trim() || undefined,
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
        address: values.address.trim() || undefined,
        city: values.city.trim() || undefined,
        country: values.country.trim() || undefined,
        contactPerson: values.contactPerson.trim() || undefined,
        status: values.status,
      };

      await axios.post(`${API_BASE}/api/vendors`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Vendor added successfully");
      resetForm();
    } catch (e) {
      if (e.response?.status === 409) {
        setFieldError(
          "vendorId",
          e.response?.data?.message || "Vendor ID already exists"
        );
      } else if (e.response?.status === 401 || e.response?.status === 403) {
        toast.error("Not authorized. Admin access required.");
      } else {
        toast.error(e.response?.data?.message || "Failed to add vendor");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // <div className="addvendor-page">
      <div className="addvendor-card">
        <h3 className="addvendor-title">Add Vendor</h3>
        <p className="addvendor-subtitle">
          Enter vendor details and save to system
        </p>

        <VendorForm
          initialValues={initialValues}
          onSubmit={handleAdd}
          submitLabel="Save Vendor"
          validateOnChange={false}
          token={token}
        />
      </div>
    // </div>
  );
}