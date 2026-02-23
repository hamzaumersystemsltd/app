import express from "express";
import {
  createPurchaseInvoice,
  listPurchaseInvoices,
  getPurchaseInvoiceById,
} from "../controllers/purchaseInvoiceController.js";
const router = express.Router();

router.post("/invoices", createPurchaseInvoice);
router.get("/invoices", listPurchaseInvoices);
router.get("/invoices/:id", getPurchaseInvoiceById);

export default router;