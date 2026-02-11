import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import VendorForm, {
  API_BASE,
  checkVendorIdAvailable,
} from "./VendorForm";
import "./AddVendor.css";

export default function EditVendor({ authToken }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const token =
    authToken ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const [loading, setLoading] = useState(true);
  const [serverVendor, setServerVendor] = useState(null); // raw API data

  /* ---------------------- Fetch existing vendor on mount ---------------------- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/vendors/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!mounted) return;
        setServerVendor(res.data);
      } catch (err) {
        toast.error("Failed to load vendor details");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, token]);

  /* ---------------- Map API → Form initial values (always strings) ---------------- */
  const initialValues = useMemo(() => {
    if (!serverVendor) {
      return {
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
    }

    return {
      vendorId: serverVendor.vendorId ?? "",
      name: serverVendor.name ?? "",
      companyName: serverVendor.companyName ?? "",
      email: serverVendor.email ?? "",
      phone: serverVendor.phone ?? "",
      address: serverVendor.address ?? "",
      city: serverVendor.city ?? "",
      country: serverVendor.country ?? "",
      contactPerson: serverVendor.contactPerson ?? "",
      status: serverVendor.status ?? "active",
    };
  }, [serverVendor]);

  /* ------------------------------- Handle update ------------------------------- */
  const handleUpdate = async (values, { setSubmitting, setFieldError }) => {
    try {
      if (!token) {
        toast.error("Not authorized. Please log in.");
        setSubmitting(false);
        return;
      }

      // Only check duplicate vendorId if changed
      const originalId = serverVendor?.vendorId || "";
      const newId = values.vendorId.trim();

      if (newId !== originalId) {
        const available = await checkVendorIdAvailable(newId, token);
        if (!available) {
          setFieldError("vendorId", "This vendor ID already exists");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        vendorId: newId,
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

      await axios.put(`${API_BASE}/api/vendors/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Vendor updated successfully");
      navigate("/vendor/vendor-list");
    } catch (err) {
      if (err.response?.status === 409) {
        setFieldError(
          "vendorId",
          err.response?.data?.message || "Vendor ID already exists"
        );
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Not authorized. Admin access required.");
      } else {
        toast.error(err.response?.data?.message || "Failed to update vendor");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------- UI States ------------------------------- */

  if (loading) {
    return <h3 className="text-center mt-4">Loading...</h3>;
  }

  if (!serverVendor) {
    return <h3 className="text-center mt-4">Vendor not found</h3>;
  }

  /* ------------------------------- Main UI ------------------------------- */
  return (
    <div className="addvendor-page">
      <div className="addvendor-card">
        <h3 className="addvendor-title">Edit Vendor</h3>
        <p className="addvendor-subtitle">Update vendor details and save changes</p>

        <VendorForm
          initialValues={initialValues}
          onSubmit={handleUpdate}
          submitLabel="Update Vendor"
          enableReinitialize
          validateOnChange={false}
          token={token}
        />
      </div>
    </div>
  );
}