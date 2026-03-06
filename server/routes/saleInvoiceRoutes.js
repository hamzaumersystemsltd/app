import express from "express";
import {
  createSaleInvoice,
  listSaleInvoices,
  getSaleInvoiceById,
  deleteSaleInvoice,
} from "../controllers/SaleInvoiceController.js";
const router = express.Router();

router.post("/invoices", createSaleInvoice);
router.get("/invoices", listSaleInvoices);
router.get("/invoices/:id", getSaleInvoiceById);
router.delete("/invoices/:id", deleteSaleInvoice);

export default router;