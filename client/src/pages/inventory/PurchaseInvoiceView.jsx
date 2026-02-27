import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./Purchaseinvoiceview.css";

const API_BASE = "http://localhost:5000";
const CURRENCY = "PKR";
const money = (n) =>
  `${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${CURRENCY}`;
const fmtDate = (val) =>
  val ? new Date(val).toLocaleString() : "-";

export default function PurchaseInvoiceView() {
  const { id } = useParams();

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load invoice
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/purchases/invoices/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!isMounted) return;
        setInvoice(res.data);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to load invoice");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  if (loading) {
    return (
      <div className="pi-card" style={{ padding: 30, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="pi-card" style={{ padding: 30, textAlign: "center" }}>
        Invoice not found.
      </div>
    );
  }

  return (
    <div className="pi-card">
      {/* Header */}
      <div className="pi-header" style={{ marginBottom: 6 }}>
        <div>
          <h2 className="pi-title">Invoice #{invoice.invoiceNo}</h2>
          <p className="pi-subtitle">
            Created: {fmtDate(invoice.createdAt)}<br />
            Updated: {fmtDate(invoice.updatedAt)}
          </p>
        </div>
      </div>

      {/* Items table */}
      <div className="pi-table-wrap">
        <table className="pi-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item Code</th>
              <th>Name</th>
              <th>Vendor</th>
              <th>Cost</th>
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
                <td className="pi-text-center">{it.vendorName || "-"}</td>
                <td className="pi-text-center">{money(it.costPrice)}</td>
                <td className="pi-text-center">{it.quantity}</td>
                <td className="pi-text-center">{money(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="pi-totals" style={{ marginTop: 20 }}>
        <div className="pi-totals-card">

          <div className="pi-total-row">
            <span className="label">Subtotal</span>
            <span className="value">{money(invoice.subTotal)}</span>
          </div>

          <div className="pi-total-row">
            <span className="label">Discount</span>
            <span className="value">{money(invoice.discount)}</span>
          </div>

          <div className="pi-total-row">
            <span className="label">
              <strong>Grand Total</strong>
            </span>
            <span className="value">
              <strong>{money(invoice.grandTotal)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}