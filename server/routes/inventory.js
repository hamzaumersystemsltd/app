import express from "express";
import multer from "multer";
import path from "path";
import InventoryItem from "../models/Item.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();
router.use(protect, authorizeRoles("admin"));

// ===== Supabase / Multer setup =====
const BUCKET = process.env.SUPABASE_BUCKET || "inventory-images";

// In-memory storage; we will push the buffer to Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Basic safe slug (avoid extra deps)
function safeSlug(str = "") {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildImagePath(itemCode, name, originalname) {
  const ext = (path.extname(originalname || "") || ".jpg").toLowerCase();
  const ts = Date.now();
  const codePart = safeSlug(itemCode || "code");
  const namePart = safeSlug(name || "item");
  return `${codePart}/${ts}_${namePart}${ext}`;
}

async function uploadToSupabase(file, storagePath) {
  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { publicUrl: data.publicUrl, storagePath };
}

async function removeFromSupabase(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) {
    // Non-fatal: log only
    console.warn("Supabase remove warning:", error.message);
  }
}

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
      InventoryItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
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

// --- CREATE (multipart/form-data with optional image) ---
router.post("/", upload.single("imageFile"), async (req, res) => {
  try {
    const {
      itemCode,
      name,
      category,
      wsPrice,
      rtPrice,
      costPrice,
      stockQuantity,
      description,
    } = req.body;

    const code = String(itemCode || "").trim();
    if (!code) return res.status(400).json({ message: "Item code is required" });

    const exists = await InventoryItem.findOne({ itemCode: code });
    if (exists) return res.status(409).json({ message: "Item code already exists" });

    const ws = Number(wsPrice);
    const rt = Number(rtPrice);
    const cost = Number(costPrice);

    if (!(rt >= ws && ws >= cost)) {
      return res.status(400).json({ message: "Price rule: retail ≥ wholesale ≥ cost" });
    }

    const by = req.user?.email || req.user?.name || req.user?.id || "admin";

    let image = null;
    let imagePath = null;
    if (req.file) {
      const storagePath = buildImagePath(code, name, req.file.originalname);
      const uploaded = await uploadToSupabase(req.file, storagePath);
      image = uploaded.publicUrl;
      imagePath = uploaded.storagePath;
    }

    const doc = await InventoryItem.create({
      itemCode: code,
      name: String(name || "").trim(),
      category: String(category || "").trim(),
      wsPrice: ws,
      rtPrice: rt,
      costPrice: cost,
      stockQuantity: Number(stockQuantity ?? 0),
      description: String(description || "").trim(),
      image,
      imagePath,
      createdBy: by,
      updatedBy: by,
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error("Create inventory error:", err);
    return res.status(500).json({ message: "Failed to create inventory item" });
  }
});

// --- UPDATE (partial) with optional image replace ---
router.patch("/:id", upload.single("imageFile"), async (req, res) => {
  try {
    const allowed = [
      "itemCode",
      "name",
      "category",
      "wsPrice",
      "rtPrice",
      "costPrice",
      "stockQuantity",
      "description",
    ];

    // Load current doc first (needed for price rule + image replacement)
    const current = await InventoryItem.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Not found" });

    const update = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }

    // If itemCode is changing, enforce uniqueness
    if (update.itemCode) {
      const newCode = String(update.itemCode || "").trim();
      const exists = await InventoryItem.findOne({
        itemCode: newCode,
        _id: { $ne: req.params.id },
      }).lean();
      if (exists) return res.status(409).json({ message: "Item code already exists" });
      update.itemCode = newCode;
    }

    // Normalize numbers for price rule and stock
    const ws = Number(update.wsPrice ?? current.wsPrice);
    const rt = Number(update.rtPrice ?? current.rtPrice);
    const cost = Number(update.costPrice ?? current.costPrice);
    if (!(rt >= ws && ws >= cost)) {
      return res.status(400).json({ message: "Price rule: retail ≥ wholesale ≥ cost" });
    }
    if ("wsPrice" in update) update.wsPrice = Number(update.wsPrice);
    if ("rtPrice" in update) update.rtPrice = Number(update.rtPrice);
    if ("costPrice" in update) update.costPrice = Number(update.costPrice);
    if ("stockQuantity" in update) update.stockQuantity = Number(update.stockQuantity);

    // Handle optional new image
    if (req.file) {
      const effectiveCode = update.itemCode || current.itemCode;
      const effectiveName = update.name || current.name;
      const storagePath = buildImagePath(effectiveCode, effectiveName, req.file.originalname);

      const uploaded = await uploadToSupabase(req.file, storagePath);
      update.image = uploaded.publicUrl;
      update.imagePath = uploaded.storagePath;

      // Remove the old image (non-fatal if it fails)
      if (current.imagePath && current.imagePath !== update.imagePath) {
        await removeFromSupabase(current.imagePath);
      }
    }

    update.updatedBy =
      req.user?.email || req.user?.name || req.user?.id || "admin";

    const doc = await InventoryItem.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    console.error("Update inventory error:", err);
    return res.status(500).json({ message: "Failed to update inventory item" });
  }
});

// --- UPDATE (full) with optional image replace ---
router.put("/:id", upload.single("imageFile"), async (req, res) => {
  try {
    const {
      itemCode,
      name,
      category,
      wsPrice,
      rtPrice,
      costPrice,
      stockQuantity,
      description,
    } = req.body;

    if (!itemCode || !name || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Load current doc (for image replacement & price rule context)
    const current = await InventoryItem.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Not found" });

    // Enforce unique itemCode when changing
    const newCode = String(itemCode || "").trim();
    const exists = await InventoryItem.findOne({
      itemCode: newCode,
      _id: { $ne: req.params.id },
    }).lean();
    if (exists) return res.status(409).json({ message: "Item code already exists" });

    const ws = Number(wsPrice);
    const rt = Number(rtPrice);
    const cost = Number(costPrice);
    if (!(rt >= ws && ws >= cost)) {
      return res.status(400).json({ message: "Price rule: retail ≥ wholesale ≥ cost" });
    }

    const update = {
      itemCode: newCode,
      name: String(name || "").trim(),
      category: String(category || "").trim(),
      wsPrice: ws,
      rtPrice: rt,
      costPrice: cost,
      stockQuantity: Number(stockQuantity ?? 0),
      description: String(description || "").trim(),
      updatedBy: req.user?.email || req.user?.name || req.user?.id || "admin",
    };

    // Handle optional new image
    if (req.file) {
      const storagePath = buildImagePath(newCode, name, req.file.originalname);

      const uploaded = await uploadToSupabase(req.file, storagePath);
      update.image = uploaded.publicUrl;
      update.imagePath = uploaded.storagePath;

      // Remove the old image (non-fatal if it fails)
      if (current.imagePath && current.imagePath !== update.imagePath) {
        await removeFromSupabase(current.imagePath);
      }
    }

    const doc = await InventoryItem.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    console.error("Full update inventory error:", err);
    return res.status(500).json({ message: "Failed to update inventory item" });
  }
});

// --- DELETE (also remove image from Supabase if present) ---
router.delete("/:id", async (req, res) => {
  try {
    const doc = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    if (doc.imagePath) {
      await removeFromSupabase(doc.imagePath);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete inventory item" });
  }
});

export default router;