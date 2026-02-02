import express from "express";
import InventoryItem from "../models/Item.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorizeRoles("admin"));

// --- Check code availability ---
router.get("/check-code", async (req, res) => {
  try {
    const code = (req.query.code || "").trim();
    if (!code) return res.status(400).json({ message: "Missing code" });
    const exists = await InventoryItem.findOne({ itemCode: code }).lean();
    return res.json({ available: !exists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to check item code" });
  }
});

// --- LIST with simple search & pagination ---
router.get("/", async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (q) {
      // name / code / category fuzzy match
      const rx = new RegExp(q.trim(), "i");
      filter.$or = [{ name: rx }, { itemCode: rx }, { category: rx }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      InventoryItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      InventoryItem.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
});

// --- VIEW one ---
router.get("/:id", async (req, res) => {
  try {
    const doc = await InventoryItem.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch item" });
  }
});

// --- CREATE ---
router.post("/", async (req, res) => {
  try {
    const {
      itemCode, name, category,
      wsPrice, rtPrice, costPrice,
      stockQuantity, description,
    } = req.body;

    const exists = await InventoryItem.findOne({ itemCode: (itemCode || "").trim() });
    if (exists) return res.status(409).json({ message: "Item code already exists" });

    const ws = Number(wsPrice), rt = Number(rtPrice), cost = Number(costPrice);
    if (!(rt >= ws && ws >= cost)) {
      return res.status(400).json({ message: "Price rule: retail ≥ wholesale ≥ cost" });
    }

    const by = req.user?.email || req.user?.name || req.user?.id || "admin";

    const doc = await InventoryItem.create({
      itemCode: itemCode.trim(),
      name: name.trim(),
      category: category.trim(),
      wsPrice: ws,
      rtPrice: rt,
      costPrice: cost,
      stockQuantity: Number(stockQuantity ?? 0),
      description: (description || "").trim(),
      createdBy: by,
      updatedBy: by,
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create inventory item" });
  }
});

// --- UPDATE (partial) ---
router.patch("/:id", async (req, res) => {
  try {
    const allowed = [
      "itemCode", "name", "category", "wsPrice", "rtPrice", "costPrice", "stockQuantity", "description",
    ];
    const update = {};
    for (const key of allowed) if (key in req.body) update[key] = req.body[key];

    // If itemCode is changing, enforce uniqueness
    if (update.itemCode) {
      const exists = await InventoryItem.findOne({
        itemCode: (update.itemCode || "").trim(),
        _id: { $ne: req.params.id },
      }).lean();
      if (exists) return res.status(409).json({ message: "Item code already exists" });
    }

    // Validate price rule using current doc values
    if ("wsPrice" in update || "rtPrice" in update || "costPrice" in update) {
      const doc = await InventoryItem.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ message: "Not found" });

      const ws = Number(update.wsPrice ?? doc.wsPrice);
      const rt = Number(update.rtPrice ?? doc.rtPrice);
      const cost = Number(update.costPrice ?? doc.costPrice);
      if (!(rt >= ws && ws >= cost)) {
        return res.status(400).json({ message: "Price rule: retail ≥ wholesale ≥ cost" });
      }
    }

    update.updatedBy = req.user?.email || req.user?.name || req.user?.id || "admin";

    const doc = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update inventory item" });
  }
});

// --- (Optional) UPDATE (full) to match axios.put on frontend ---
router.put("/:id", async (req, res) => {
  try {
    // Treat PUT like a full payload update (you can tailor as needed)
    const {
      itemCode, name, category,
      wsPrice, rtPrice, costPrice,
      stockQuantity, description,
    } = req.body;

    if (!itemCode || !name || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Enforce unique itemCode when changing
    const exists = await InventoryItem.findOne({
      itemCode: (itemCode || "").trim(),
      _id: { $ne: req.params.id },
    }).lean();
    if (exists) return res.status(409).json({ message: "Item code already exists" });

    const ws = Number(wsPrice), rt = Number(rtPrice), cost = Number(costPrice);
    if (!(rt >= ws && ws >= cost)) {
      return res.status(400).json({ message: "Price rule: retail ≥ wholesale ≥ cost" });
    }

    const update = {
      itemCode: itemCode.trim(),
      name: name.trim(),
      category: category.trim(),
      wsPrice: ws,
      rtPrice: rt,
      costPrice: cost,
      stockQuantity: Number(stockQuantity ?? 0),
      description: (description || "").trim(),
      updatedBy: req.user?.email || req.user?.name || req.user?.id || "admin",
    };

    const doc = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update inventory item" });
  }
});

// --- DELETE ---
router.delete("/:id", async (req, res) => {
  try {
    const doc = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete inventory item" });
  }
});

export default router;