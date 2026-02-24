import mongoose from "mongoose";
import PurchaseInvoice from "../models/PurchaseInvoice.js"
import Item from "../models/Item.js"
import Vendor from "../models/Vendor.js"

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v));

export async function createPurchaseInvoice(req, res) {
  try {
    const { items, discount = 0 } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Normalize input
    const normalized = items.map((it) => ({
      itemCode: String(it.itemCode || "").trim(),
      name: String(it.name || "").trim(),
      costPrice: Number(it.costPrice || 0),
      quantity: Number(it.quantity || 0),
      vendorId: it.vendorId,
    }));

    // Validate rows
    for (const it of normalized) {
      if (!/^\d{5}$/.test(it.itemCode)) {
        return res.status(400).json({ message: `Invalid item code: ${it.itemCode}` });
      }
      if (!it.name) {
        return res.status(400).json({ message: `Missing name for ${it.itemCode}` });
      }
      if (it.costPrice < 0) {
        return res.status(400).json({ message: `Negative cost for ${it.itemCode}` });
      }
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
        return res.status(400).json({ message: `Quantity must be > 0 for ${it.itemCode}` });
      }
      if (!it.vendorId || !isObjectId(it.vendorId)) {
        return res.status(400).json({ message: `Invalid vendor for ${it.itemCode}` });
      }
    }

    // Ensure item codes exist
    const wantedCodes = normalized.map((n) => n.itemCode);
    const foundItems = await Item.find(
      { itemCode: { $in: wantedCodes } },
      { itemCode: 1 }
    );
    const foundSet = new Set(foundItems.map((d) => d.itemCode));
    const missingCodes = wantedCodes.filter((c) => !foundSet.has(c));

    if (missingCodes.length) {
      return res.status(404).json({
        message: "Some items not found",
        missingCodes,
      });
    }

    // Ensure vendors exist + fetch vendor names
    const vendorIds = [...new Set(normalized.map((n) => n.vendorId))];
    const vendorDocs = await Vendor.find(
      { _id: { $in: vendorIds } },
      { companyName: 1 }
    );

    const vendorMap = {};
    vendorDocs.forEach((v) => (vendorMap[v._id] = v.companyName));

    if (vendorDocs.length !== vendorIds.length) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Compute totals
    const itemsWithTotals = normalized.map((n) => ({
      ...n,
      vendorName: vendorMap[n.vendorId],
      lineTotal: Number((n.costPrice * n.quantity).toFixed(2)),
    }));

    const serverSubTotal = itemsWithTotals.reduce(
      (sum, r) => sum + r.lineTotal,
      0
    );
    const safeDiscount = Math.max(Number(discount) || 0, 0);
    const serverGrand = Number((serverSubTotal - safeDiscount).toFixed(2));

    // AUTO-INCREMENT INVOICE NUMBER
    const lastInvoice = await PurchaseInvoice.findOne().sort({ invoiceNo: -1 });
    const nextInvoiceNo = lastInvoice ? lastInvoice.invoiceNo + 1 : 1;

    // Save invoice
    const invoice = await PurchaseInvoice.create({
      invoiceNo: nextInvoiceNo,
      items: itemsWithTotals,
      subTotal: serverSubTotal,
      discount: safeDiscount,
      grandTotal: serverGrand,
    });

    // Increase stock
    const stockOps = itemsWithTotals.map((it) => ({
      updateOne: {
        filter: { itemCode: it.itemCode },
        update: { $inc: { stockQuantity: it.quantity } },
      },
    }));
    await Item.bulkWrite(stockOps);

    return res.status(201).json({
      message: "Invoice saved",
      invoiceId: invoice._id,
      invoiceNo: nextInvoiceNo,
      invoice,
    });
  } catch (err) {
    console.error("Invoice save error:", err);
    return res
      .status(500)
      .json({ message: "Server error saving invoice", error: err.message });
  }
}

export async function listPurchaseInvoices(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { search, dateFrom, dateTo } = req.query;

    const filter = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from)) filter.createdAt.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to)) {
          to.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = to;
        }
      }
    }

    if (search && String(search).trim() !== "") {
      const s = String(search).trim();
      const maybeNumber = Number(s);

      const orConditions = [];

      // invoice number match
      if (Number.isFinite(maybeNumber)) {
        orConditions.push({ invoiceNo: maybeNumber });
      }

      // array field search using $elemMatch
      orConditions.push({
        items: {
          $elemMatch: {
            $or: [
              { itemCode: new RegExp(s, "i") },
              { name: new RegExp(s, "i") },
              { vendorName: new RegExp(s, "i") },
            ],
          },
        },
      });

      filter.$or = orConditions;
    }

    const [items, total] = await Promise.all([
      PurchaseInvoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      PurchaseInvoice.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("listPurchaseInvoices error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}

export async function getPurchaseInvoiceById(req, res) {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }
    const invoice = await PurchaseInvoice.findById(id).lean();
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export async function deletePurchaseInvoice(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }
    const deleted = await PurchaseInvoice.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Invoice not found" });
    return res.json({ message: "Invoice deleted" });
  } catch (err) {
    console.error("deletePurchaseInvoice error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}