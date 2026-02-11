import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import InventoryForm, {
  API_BASE,
  checkItemCodeAvailable,
} from "./InventoryForm";
import "./AddInventory.css";

export default function EditInventory({ authToken }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const token =
    authToken ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const [loading, setLoading] = useState(true);
  const [serverItem, setServerItem] = useState(null); // raw from API

  // Fetch existing item
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/inventory/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!mounted) return;
        setServerItem(res.data);
      } catch (e) {
        toast.error("Failed to load item");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, token]);

  // Map API -> Form values (ensure strings where needed)
  const initialValues = useMemo(() => {
    if (!serverItem) {
      return {
        itemCode: "",
        name: "",
        category: "",
        wsPrice: "",
        rtPrice: "",
        costPrice: "",
        stockQuantity: "",
        description: "",
      };
    }
    return {
      itemCode: serverItem.itemCode ?? "",
      name: serverItem.name ?? "",
      category: serverItem.category ?? "",
      wsPrice: String(serverItem.wsPrice ?? ""),
      rtPrice: String(serverItem.rtPrice ?? ""),
      costPrice: String(serverItem.costPrice ?? ""),
      stockQuantity: String(serverItem.stockQuantity ?? ""),
      description: serverItem.description ?? "",
    };
  }, [serverItem]);

  const handleUpdate = async (values, { setSubmitting, setFieldError }) => {
    try {
      if (!token) {
        toast.error("Not authorized. Please log in.");
        setSubmitting(false);
        return;
      }

      // Only run duplicate check if itemCode changed
      const originalCode = serverItem?.itemCode || "";
      const newCode = values.itemCode.trim();
      if (newCode !== originalCode) {
        const available = await checkItemCodeAvailable(newCode, token);
        if (!available) {
          setFieldError("itemCode", "This item code already exists");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        itemCode: newCode,
        name: values.name.trim(),
        category: values.category.trim(),
        wsPrice: Number(values.wsPrice),
        rtPrice: Number(values.rtPrice),
        costPrice: Number(values.costPrice),
        stockQuantity: Number(values.stockQuantity),
        description: values.description?.trim() || undefined,
      };

      await axios.put(`${API_BASE}/api/inventory/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Inventory updated successfully");
      navigate("/inventory/inventory-list");
    } catch (e) {
      if (e.response?.status === 409) {
        setFieldError("itemCode", e.response?.data?.message || "Item code already exists");
      } else if (e.response?.status === 401 || e.response?.status === 403) {
        toast.error("Not authorized. Admin access required.");
      } else {
        toast.error(e.response?.data?.message || "Failed to update inventory item");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <h3 className="text-center mt-4">Loading...</h3>;
  }

  if (!serverItem) {
    return <h3 className="text-center mt-4">Item not found</h3>;
  }

  return (
    <div className="addinventory-page">
      <div className="addinventory-card">
        <h3 className="addinventory-title">Edit Inventory</h3>
        <p className="addinventory-subtitle">Update item details and save changes</p>

        <InventoryForm
          initialValues={initialValues}
          onSubmit={handleUpdate}
          submitLabel="Update Item"
          enableReinitialize
          validateOnChange={false}
          token={token}
        />
      </div>
    </div>
  );
}