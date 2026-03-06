import mongoose from "mongoose";

const PurchaseItemSchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, match: [/^\d{5}$/], trim: true },
    name: { type: String, required: true, trim: true },
    costPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    vendorName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PurchaseInvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: Number, unique: true },
    items: [PurchaseItemSchema],
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);