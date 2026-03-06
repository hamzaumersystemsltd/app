import mongoose from "mongoose";
import SaleInvoice from "../models/SaleInvoice.js";
import Item from "../models/Item.js";
import Counter from "../models/SaleCounter.js";

async function getNextSaleInvoiceNumber() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: "sale_invoice" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter?.seq ?? 1;
}

export async function createSaleInvoice(req, res) {
  try {
    const {
      items,
      customerName = "",
      customerPhone = "",
      discount = 0,
    } = req.body;

    // Must have at least one item
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Normalize items
    const normalized = items.map((it) => ({
      itemCode: String(it.itemCode || "").trim(),
      name: String(it.name || "").trim(),
      salePrice: Number(it.salePrice || 0),
      quantity: Number(it.quantity || 0),
    }));

    // Validate each row
    for (const it of normalized) {
      if (!/^\d{5}$/.test(it.itemCode)) {
        return res.status(400).json({
          message: `Invalid item code: ${it.itemCode}`,
        });
      }
      if (!it.name) {
        return res
          .status(400)
          .json({ message: `Missing name for ${it.itemCode}` });
      }
      if (it.salePrice < 0) {
        return res
          .status(400)
          .json({ message: `Negative sale price for ${it.itemCode}` });
      }
      if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
        return res.status(400).json({
          message: `Quantity must be > 0 for ${it.itemCode}`,
        });
      }
    }

    // Ensure item codes exist
    const wantedCodes = normalized.map((n) => n.itemCode);
    const foundItems = await Item.find(
      { itemCode: { $in: wantedCodes } },
      { itemCode: 1, stockQuantity: 1 }
    );

    const stockMap = {};
    foundItems.forEach((d) => (stockMap[d.itemCode] = d.stockQuantity));

    const missingCodes = wantedCodes.filter((c) => !(c in stockMap));
    if (missingCodes.length) {
      return res.status(404).json({
        message: "Some items not found",
        missingCodes,
      });
    }

    // Ensure enough stock exists
    const insufficient = normalized.filter(
      (it) => stockMap[it.itemCode] < it.quantity
    );

    if (insufficient.length > 0) {
      return res.status(400).json({
        message: "Insufficient stock",
        details: insufficient,
      });
    }

    // Compute totals
    const itemsWithTotals = normalized.map((n) => ({
      ...n,
      lineTotal: Number((n.salePrice * n.quantity).toFixed(2)),
    }));

    const serverSubTotal = itemsWithTotals.reduce(
      (sum, r) => sum + r.lineTotal,
      0
    );
    const safeDiscount = Math.max(Number(discount) || 0, 0);
    const serverGrand = Number((serverSubTotal - safeDiscount).toFixed(2));

    // Get invoice number
    const invoiceNo = await getNextSaleInvoiceNumber();

    // Create invoice
    const invoice = await SaleInvoice.create({
      invoiceNo,
      customerName,
      customerPhone,
      items: itemsWithTotals,
      subTotal: serverSubTotal,
      discount: safeDiscount,
      grandTotal: serverGrand,
    });

    // Decrease stock
    const stockOps = itemsWithTotals.map((it) => ({
      updateOne: {
        filter: { itemCode: it.itemCode },
        update: { $inc: { stockQuantity: -it.quantity } },
      },
    }));

    if (stockOps.length) {
      await Item.bulkWrite(stockOps);
    }

    return res.status(201).json({
      message: "Sale invoice saved",
      invoiceId: invoice._id,
      invoiceNo,
      invoice,
    });
  } catch (err) {
    console.error("Sale invoice save error:", err);
    return res.status(500).json({
      message: "Server error saving sale invoice",
      error: err.message,
    });
  }
}

export async function listSaleInvoices(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { search, dateFrom, dateTo } = req.query;

    const filter = {};

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    if (search && String(search).trim() !== "") {
      const s = String(search).trim();
      const maybeNumber = Number(s);

      const orConditions = [];

      if (Number.isFinite(maybeNumber)) {
        orConditions.push({ invoiceNo: maybeNumber });
      }

      orConditions.push({
        items: {
          $elemMatch: {
            $or: [
              { itemCode: new RegExp(s, "i") },
              { name: new RegExp(s, "i") },
            ],
          },
        },
      });

      orConditions.push({ customerName: new RegExp(s, "i") });
      orConditions.push({ customerPhone: new RegExp(s, "i") });

      filter.$or = orConditions;
    }

    const [items, total] = await Promise.all([
      SaleInvoice.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      SaleInvoice.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("listSaleInvoices error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}

export async function getSaleInvoiceById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }

    const invoice = await SaleInvoice.findById(id).lean();
    if (!invoice)
      return res.status(404).json({ message: "Invoice not found" });

    res.json(invoice);
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}

export async function deleteSaleInvoice(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: "Invalid invoice id" });
    }

    const invoice = await SaleInvoice.findByIdAndDelete(id);
    if (!invoice)
      return res.status(404).json({ message: "Invoice not found" });

    return res.json({ message: "Invoice deleted" });
  } catch (err) {
    console.error("deleteSaleInvoice error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}