import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    itemCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    wsPrice: { type: Number, required: true },
    rtPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: String, trim: true, default: null },
    imagePath: { type: String, trim: true, default: null },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("InventoryItem", inventorySchema);