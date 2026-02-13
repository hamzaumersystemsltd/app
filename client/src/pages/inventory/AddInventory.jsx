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
    imageFile: null, // <-- important for Formik
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

      // Pre-check itemCode uniqueness via API
      const code = (values.itemCode || "").trim();
      const available = await checkItemCodeAvailable(code, token);
      if (!available) {
        setFieldError("itemCode", "This item code already exists");
        setSubmitting(false);
        return;
      }

      // Build multipart/form-data payload
      const formData = new FormData();
      formData.append("itemCode", code);
      formData.append("name", (values.name || "").trim());
      formData.append("category", (values.category || "").trim());
      formData.append("wsPrice", String(values.wsPrice));
      formData.append("rtPrice", String(values.rtPrice));
      formData.append("costPrice", String(values.costPrice));
      formData.append("stockQuantity", String(values.stockQuantity ?? 0));
      if (values.description?.trim()) {
        formData.append("description", values.description.trim());
      }
      if (values.imageFile instanceof File) {
        // must match multer field name on server: upload.single("imageFile")
        formData.append("imageFile", values.imageFile);
      }

      await axios.post(`${API_BASE}/api/inventory`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Inventory item added successfully");
      resetForm();
    } catch (e) {
      if (e.response?.status === 409) {
        setFieldError(
          "itemCode",
          e.response?.data?.message || "Item code already exists"
        );
      } else if (e.response?.status === 400) {
        // e.g., price rule or multer file validation
        toast.error(e.response?.data?.message || "Validation failed");
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
    <div className="addinventory-card">
      <h3 className="addinventory-title">Add Inventory</h3>
      <p className="addinventory-subtitle">
        Enter item details and save to inventory
      </p>

      <InventoryForm
        initialValues={initialValues}
        onSubmit={handleAdd}
        submitLabel="Save Item"
        validateOnChange={false}
        token={token}
      />
    </div>
  );
}