import express from "express";
import {
  createPurchaseInvoice,
  listPurchaseInvoices,
  getPurchaseInvoiceById,
  deletePurchaseInvoice,
} from "../controllers/purchaseInvoiceController.js";
const router = express.Router();

router.post("/invoices", createPurchaseInvoice);
router.get("/invoices", listPurchaseInvoices);
router.get("/invoices/:id", getPurchaseInvoiceById);
router.delete("/invoices/:id", deletePurchaseInvoice);

export default router;