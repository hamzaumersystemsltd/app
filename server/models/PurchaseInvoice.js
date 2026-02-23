import mongoose from "mongoose";

const PurchaseItemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: true,
      match: [/^\d{5}$/, "Item code must be exactly 5 digits"],
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    vendorName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PurchaseInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: Number, required: true, unique: true },
    items: {
      type: [PurchaseItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Invoice must contain at least one item",
      },
    },
    subTotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    // Optional: add notes, createdBy, invoiceDate, etc.
  },
  { timestamps: true }
);

export default mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);