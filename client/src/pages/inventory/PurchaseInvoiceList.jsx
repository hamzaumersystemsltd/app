import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/material.css";
import { FiRefreshCw, FiLoader, FiEye, FiCalendar, FiSearch, FiTrash2 } from "react-icons/fi";
import "./PurchaseInvoiceList.css";

const API_BASE = "http://localhost:5000";
const CURRENCY = "PKR";

/* ===== Helpers ===== */
function formatMoney(n) {
  const v = Number(n || 0);
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${CURRENCY}`;
}
function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString(); // or toLocaleDateString()
}

/* ===== Component ===== */
export default function PurchaseInvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(false);

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/purchases/invoices`, {
        params: {
          page,
          limit,
          search: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = res.data || {};
      setInvoices(Array.isArray(data.items) ? data.items : []);
      setTotal(Number.isFinite(data.total) ? data.total : (data.items?.length || 0));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, dateFrom, dateTo, token]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleRefresh = async () => {
    await load();
    toast.success("Invoices refreshed", { autoClose: 900 });
  };

  // Confirm + Delete
  const handleDelete = (invId, display = "") => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <strong>Delete invoice {display ? `#${display}` : ""}?</strong>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button
              className="btn danger"
              onClick={async () => {
                try {
                  await axios.delete(`${API_BASE}/api/purchases/invoices/${invId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });
                  // Optimistic update
                  setInvoices((prev) => prev.filter((x) => x._id !== invId));
                  setTotal((t) => Math.max(0, t - 1));
                  closeToast();
                  toast.success("Invoice deleted", { autoClose: 1200 });
                } catch (err) {
                  console.error(err);
                  toast.error(err.response?.data?.message || "Failed to delete invoice");
                }
              }}
            >
              Delete
            </button>
            <button className="btn secondary" onClick={closeToast}>
              Cancel
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false }
    );
  };

  // Derived summaries for display
  const vendorsSummary = (inv) => {
    const set = new Set((inv.items || []).map((it) => it.vendorName || "-"));
    const names = [...set].filter(Boolean);
    if (names.length <= 2) return names.join(", ") || "-";
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  };
  const itemsCount = (inv) => (inv.items ? inv.items.length : 0);

  return (
    <div className="invoice-card">
      {/* Header */}
      <div className="invoice-header">
        <div>
          <h3 className="invoice-title">Purchase Invoices</h3>
          <p className="invoice-subtitle">Search, filter, and view all purchase invoices</p>
        </div>

        <div className="invoice-header-actions">
          {/* Search + Dates */}
          <div className="invoice-search">
            {/* Search */}
            <div className="input-with-icon" style={{ minWidth: 260 }}>
              <FiSearch
                size={16}
                style={{ position: "absolute", left: 10, top: 12, opacity: 0.7 }}
              />
              <input
                className="input"
                placeholder="Search by invoice no, item or vendor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Date from */}
            <div className="input-with-icon" style={{ minWidth: 180 }}>
              <FiCalendar
                size={16}
                style={{ position: "absolute", left: 10, top: 12, opacity: 0.7 }}
              />
              <input
                type="date"
                className="input"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Date to */}
            <div className="input-with-icon" style={{ minWidth: 180 }}>
              <FiCalendar
                size={16}
                style={{ position: "absolute", left: 10, top: 12, opacity: 0.7 }}
              />
              <input
                type="date"
                className="input"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Refresh */}
          <Tippy content="Refresh" theme="material" delay={[150, 0]} placement="bottom">
            <button
              type="button"
              onClick={handleRefresh}
              className="icon-button"
              aria-label="Refresh"
              disabled={loading}
            >
              {loading ? <FiLoader size={18} className="spin" /> : <FiRefreshCw size={18} />}
            </button>
          </Tippy>
        </div>
      </div>

      {/* Total + Per page */}
      <div className="invoice-actions">
        <div className="invoice-total">
          <strong>Total:</strong> {total}
        </div>

        <div className="invoice-perpage">
          <label>Per page</label>
          <select
            className="input"
            style={{ width: 120 }}
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Subtotal</th>
              <th>Discount</th>
              <th>Grand Total</th>
              <th>Vendors</th>
              <th>Items</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="row-center">
                  Loading...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="9" className="row-center">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv, idx) => (
                <tr key={inv._id}>
                  <td className="pi-text-center">{(page - 1) * limit + (idx + 1)}</td>
                  <td className="pi-text-center">
                    <strong>#{inv.invoiceNo ?? "-"}</strong>
                  </td>
                  <td className="pi-text-center">{formatDate(inv.createdAt)}</td>
                  <td className="pi-text-center">{formatMoney(inv.subTotal)}</td>
                  <td className="pi-text-center">{formatMoney(inv.discount)}</td>
                  <td className="pi-text-center">
                    <strong>{formatMoney(inv.grandTotal)}</strong>
                  </td>
                  <td className="pi-text-center">{vendorsSummary(inv)}</td>
                  <td className="pi-text-center">{itemsCount(inv)}</td>
                  <td className="pi-text-center">
                    <div className="actions">
                      <Tippy content="View" theme="material">
                        <Link
                          to={`/inventory/invoices/${inv._id}`}
                          className="icon-button info"
                          aria-label="View"
                        >
                          <FiEye size={18} />
                        </Link>
                      </Tippy>

                      <Tippy content="Delete" theme="material">
                        <button
                          type="button"
                          className="icon-button danger"
                          aria-label="Delete"
                          onClick={() => handleDelete(inv._id, inv.invoiceNo)}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </Tippy>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-bar">
        <button
          className="button outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          ‹ Prev
        </button>

        <div className="pagination-info">
          Page <strong>{page}</strong> of <strong>{Math.max(1, totalPages)}</strong>
        </div>

        <button
          className="button outline"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}