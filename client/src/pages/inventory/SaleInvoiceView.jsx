import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "./Saleinvoiceview.css";

const API_BASE = "http://localhost:5000";
const CURRENCY = "PKR";
const money = (n) =>
  `${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${CURRENCY}`;
const fmtDate = (val) => (val ? new Date(val).toLocaleString() : "-");

export default function SaleInvoiceView() {
  const { id } = useParams();
  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------- TEXT-BASED PDF ----------------
  const downloadPDF = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;

    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(`Invoice #${invoice.invoiceNo}`, 40, y);
    y += 28;

    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(`Created: ${fmtDate(invoice.createdAt)}`, 40, y);
    y += 16;
    pdf.text(`Updated: ${fmtDate(invoice.updatedAt)}`, 40, y);
    y += 20;

    pdf.setFont("Helvetica", "bold");
    pdf.text(invoice.customerName || "Walk-in Customer", 40, y);
    y += 16;

    if (invoice.customerPhone) {
      pdf.setFont("Helvetica", "normal");
      pdf.text(invoice.customerPhone, 40, y);
      y += 20;
    }

    // Table header
    pdf.setFont("Helvetica", "bold");
    pdf.text("#", 40, y);
    pdf.text("Item Code", 70, y);
    pdf.text("Name", 150, y);
    pdf.text("Sale Price", 320, y);
    pdf.text("Qty", 420, y);
    pdf.text("Total", 470, y);
    y += 14;

    pdf.setLineWidth(0.5);
    pdf.line(40, y, 550, y);
    y += 14;

    // Rows
    pdf.setFont("Helvetica", "normal");

    invoice.items.forEach((it, idx) => {
      pdf.text(String(idx + 1), 40, y);
      pdf.text(it.itemCode, 70, y);
      pdf.text(it.name, 150, y);
      pdf.text(money(it.salePrice), 320, y);
      pdf.text(String(it.quantity), 420, y);
      pdf.text(money(it.lineTotal), 470, y);
      y += 18;
    });

    y += 20;
    pdf.line(40, y, 550, y);
    y += 20;

    pdf.setFont("Helvetica", "bold");
    pdf.text("Subtotal:", 380, y);
    pdf.text(money(invoice.subTotal), 470, y);
    y += 18;

    pdf.text("Discount:", 380, y);
    pdf.text(money(invoice.discount), 470, y);
    y += 18;

    pdf.text("Grand Total:", 380, y);
    pdf.text(money(invoice.grandTotal), 470, y);

    pdf.save(`Sale-Invoice-${invoice.invoiceNo}.pdf`);
  };

  // ---------------- LOAD INVOICE ----------------
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/sales/invoices/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (active) setInvoice(res.data);
      } catch (err) {
        toast.error("Failed to load invoice");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => (active = false);
  }, [id, token]);

  if (loading)
    return <div className="pi-card" style={{ textAlign: "center" }}>Loading...</div>;
  if (!invoice)
    return <div className="pi-card" style={{ textAlign: "center" }}>Not found</div>;

  return (
    <div className="pi-card">

      {/* ---------------- HEADER ---------------- */}
      <div className="pi-header-row">
        <div className="pi-header-left">
          <h2 className="pi-title">Invoice #{invoice.invoiceNo}</h2>
          <p className="pi-subtitle">
            Created: {fmtDate(invoice.createdAt)} <br />
            Updated: {fmtDate(invoice.updatedAt)} <br /><br />
            {invoice.customerName} <br />
            {invoice.customerPhone}
          </p>
        </div>

        <div className="pi-header-right">
          <button className="pi-btn" onClick={downloadPDF}>Download PDF</button>
        </div>
      </div>

      {/* ---------------- TABLE ---------------- */}
      <div className="pi-table-wrap">
        <table className="pi-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Code</th>
              <th>Name</th>
              <th>Sale Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((it, idx) => (
              <tr key={idx}>
                <td className="pi-text-center">{idx + 1}</td>
                <td className="pi-text-center">{it.itemCode}</td>
                <td className="pi-text-center">{it.name}</td>
                <td className="pi-text-center">{money(it.salePrice)}</td>
                <td className="pi-text-center">{it.quantity}</td>
                <td className="pi-text-center">{money(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- TOTALS ---------------- */}
      <div className="pi-totals" style={{ marginTop: 20 }}>
        <div className="pi-totals-card">
          <div className="pi-total-row">
            <span>Subtotal</span>
            <span>{money(invoice.subTotal)}</span>
          </div>

          <div className="pi-total-row">
            <span>Discount</span>
            <span>{money(invoice.discount)}</span>
          </div>

          <div className="pi-total-row">
            <strong>Grand Total</strong>
            <strong>{money(invoice.grandTotal)}</strong>
          </div>
        </div>
      </div>

    </div>
  );
}