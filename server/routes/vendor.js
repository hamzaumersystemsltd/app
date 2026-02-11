// routes/vendor.js
import express from "express";
import Vendor from "../models/Vendor.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin‑protected API
router.use(protect, authorizeRoles("admin"));

/* ============================================================
   CHECK vendorId availability
   /api/vendors/check-id?vendorId=V001
============================================================ */
router.get("/check-id", async (req, res) => {
  try {
    const vendorId = (req.query.vendorId || "").trim();
    if (!vendorId) return res.status(400).json({ message: "Missing vendorId" });

    const exists = await Vendor.findOne({ vendorId }).lean();
    return res.json({ available: !exists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to check vendor ID" });
  }
});

/* ============================================================
   LIST vendors (with q search + pagination)
============================================================ */
router.get("/", async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (q) {
      const rx = new RegExp(q.trim(), "i");
      filter.$or = [
        { vendorId: rx },
        { name: rx },
        { companyName: rx },
        { email: rx },
        { phone: rx },
        { city: rx },
        { country: rx }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Vendor.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

/* ============================================================
   VIEW single vendor by ID
============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Vendor.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch vendor" });
  }
});

/* ============================================================
   CREATE vendor
============================================================ */
router.post("/", async (req, res) => {
  try {
    const {
      vendorId,
      name,
      companyName,
      email,
      phone,
      address,
      city,
      country,
      contactPerson,
      status,
    } = req.body;

    if (!vendorId || !name) {
      return res.status(400).json({ message: "Vendor ID and Name are required" });
    }

    const exists = await Vendor.findOne({ vendorId: vendorId.trim() }).lean();
    if (exists)
      return res.status(409).json({ message: "Vendor ID already exists" });

    const user = req.user?.email || req.user?.id || "admin";

    const doc = await Vendor.create({
      vendorId: vendorId.trim(),
      name: name.trim(),
      companyName: companyName?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      country: country?.trim(),
      contactPerson: contactPerson?.trim(),
      status: status || "active",
      createdBy: user,
      updatedBy: user,
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create vendor" });
  }
});

/* ============================================================
   UPDATE vendor (PATCH — partial update)
============================================================ */
router.patch("/:id", async (req, res) => {
  try {
    const allowed = [
      "vendorId",
      "name",
      "companyName",
      "email",
      "phone",
      "address",
      "city",
      "country",
      "contactPerson",
      "status",
    ];

    const update = {};
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key]?.trim?.() || req.body[key];
    }

    // Enforce unique vendorId if it is being changed
    if (update.vendorId) {
      const exists = await Vendor.findOne({
        vendorId: (update.vendorId || "").trim(),
        _id: { $ne: req.params.id },
      });
      if (exists)
        return res.status(409).json({ message: "Vendor ID already exists" });
    }

    update.updatedBy = req.user?.email || req.user?.id || "admin";

    const doc = await Vendor.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update vendor" });
  }
});

/* ============================================================
   UPDATE vendor (PUT — full update)
============================================================ */
router.put("/:id", async (req, res) => {
  try {
    const {
      vendorId,
      name,
      companyName,
      email,
      phone,
      address,
      city,
      country,
      contactPerson,
      status,
    } = req.body;

    if (!vendorId || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // unique vendorId check
    const exists = await Vendor.findOne({
      vendorId: vendorId.trim(),
      _id: { $ne: req.params.id },
    });
    if (exists)
      return res.status(409).json({ message: "Vendor ID already exists" });

    const update = {
      vendorId: vendorId.trim(),
      name: name.trim(),
      companyName: companyName?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      city: city?.trim(),
      country: country?.trim(),
      contactPerson: contactPerson?.trim(),
      status: status || "active",
      updatedBy: req.user?.email || req.user?.id || "admin",
    };

    const doc = await Vendor.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json(doc);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update vendor" });
  }
});

/* ============================================================
   DELETE vendor
============================================================ */
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Vendor.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete vendor" });
  }
});

export default router;