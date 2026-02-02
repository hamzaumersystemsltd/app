import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Tracking
    createdBy: { type: String, required: true }, 
    updatedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);