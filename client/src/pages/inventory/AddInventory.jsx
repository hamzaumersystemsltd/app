import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import InventoryForm, {
  API_BASE,
  checkItemCodeAvailable,
} from "./InventoryForm";
import "./AddInventory.css";

export default function AddInventory({ authToken }) {
  const token =
    authToken ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const initialValues = {
    itemCode: "",
    name: "",
    category: "",
    wsPrice: "",
    rtPrice: "",
    costPrice: "",
    stockQuantity: "",
    description: "",
  };

  const handleAdd = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      if (!token) {
        toast.error("Not authorized. Please log in.");
        setSubmitting(false);
        return;
      }

      const available = await checkItemCodeAvailable(values.itemCode.trim(), token);
      if (!available) {
        setFieldError("itemCode", "This item code already exists");
        setSubmitting(false);
        return;
      }

      const payload = {
        itemCode: values.itemCode.trim(),
        name: values.name.trim(),
        category: values.category.trim(),
        wsPrice: Number(values.wsPrice),
        rtPrice: Number(values.rtPrice),
        costPrice: Number(values.costPrice),
        stockQuantity: Number(values.stockQuantity),
        description: values.description?.trim() || undefined,
      };

      await axios.post(`${API_BASE}/api/inventory`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Inventory item added successfully");
      resetForm();
    } catch (e) {
      if (e.response?.status === 409) {
        setFieldError("itemCode", e.response?.data?.message || "Item code already exists");
      } else if (e.response?.status === 401 || e.response?.status === 403) {
        toast.error("Not authorized. Admin access required.");
      } else {
        toast.error(e.response?.data?.message || "Failed to add inventory item");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // <div className="addinventory-page">
      <div className="addinventory-card">
        <h3 className="addinventory-title">Add Inventory</h3>
        <p className="addinventory-subtitle">Enter item details and save to inventory</p>

        <InventoryForm
          initialValues={initialValues}
          onSubmit={handleAdd}
          submitLabel="Save Item"
          validateOnChange={false}
          token={token}
        />
      </div>
    // </div>
  );
}