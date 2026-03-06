import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: true,
      match: [/^\d{5}$/, "Item code must be exactly 5 digits"],
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    salePrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: Number, unique: true, index: true },

    customerName: { type: String, default: "", trim: true },
    customerPhone: { type: String, default: "", trim: true },

    items: {
      type: [SaleItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Invoice must contain at least one item",
      },
    },

    subTotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("SaleInvoice", SaleInvoiceSchema);