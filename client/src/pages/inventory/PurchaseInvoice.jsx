import React, { useEffect, useMemo, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/material.css";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Purchaseinvoice.css";
import axios from "axios";

const emptyRow = (id) => ({
  id,
  itemCode: "",
  name: "",
  costPrice: 0,
  quantity: 0,
  lineTotal: 0,
  locked: false,
  editing: false,
  vendorId: "",
  codeError: false,
  qtyError: false,
  vendorError: false,
});

const currency = "PKR";
const fmt = (n) => `${Number(n).toFixed(2)} ${currency}`;

export default function PurchaseInvoice() {
  const [rows, setRows] = useState([emptyRow(1)]);
  const [discount, setDiscount] = useState(0);

  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  const nextRowId = useRef(2);
  const inputRefs = useRef({});
  const formRef = useRef(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const API_BASE = "http://localhost:5000";

  const computedRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        lineTotal: Number(r.quantity || 0) * Number(r.costPrice || 0),
      })),
    [rows]
  );

  const subTotal = useMemo(
    () =>
      computedRows.reduce(
        (sum, r) => sum + (isNaN(r.lineTotal) ? 0 : r.lineTotal),
        0
      ),
    [computedRows]
  );

  const cleanedDiscount = Number(discount) > 0 ? Number(discount) : 0;
  const grandTotal = Math.max(subTotal - cleanedDiscount, 0);

  const focusRef = (key) => {
    const el = inputRefs.current[key];
    if (el && typeof el.focus === "function") {
      el.focus();
      if (el.scrollIntoView) {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  };

  const focusItemCode = (rowId) => focusRef(`itemCode-${rowId}`);
  const focusQty = (rowId) => focusRef(`qty-${rowId}`);
  const focusVendor = (rowId) => focusRef(`vendor-${rowId}`);

  const insertEmptyRowAfter = (afterRowId) => {
    const id = nextRowId.current++;
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === afterRowId);
      if (idx === -1) return [...prev, emptyRow(id)];
      const clone = [...prev];
      clone.splice(idx + 1, 0, emptyRow(id));
      return clone;
    });
    setTimeout(() => focusItemCode(id), 30);
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const editRow = (id) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              editing: true,
              codeError: false,
              qtyError: false,
              vendorError: false,
            }
          : r
      )
    );
    setTimeout(() => focusItemCode(id), 20);
  };

  const stopEditingRow = (id) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              editing: false,
              locked: r.locked || Boolean(r.name || r.costPrice),
            }
          : r
      )
    );
  };

  const tryMergeDuplicate = (itemCode, id) => {
    const lower = itemCode.trim().toLowerCase();
    const existing = rows.find(
      (r) => r.itemCode.trim().toLowerCase() === lower && r.id !== id
    );

    if (existing) {
      setRows((prev) =>
        prev
          .map((r) =>
            r.id === existing.id
              ? { ...r, quantity: Number(r.quantity || 0) + 1, qtyError: false }
              : r
          )
          .filter((r) => r.id !== id)
      );

      toast.info(`Item ${itemCode} already in list — increased quantity.`, {
        autoClose: 1400,
      });

      setTimeout(() => focusQty(existing.id), 40);
      return existing.id;
    }
    return null;
  };

  const fetchAndFillRow = async (row) => {
    const code = (row.itemCode || "").trim();

    if (!/^\d{5}$/.test(code)) {
      toast.error("Item code must be exactly 5 digits (e.g., 00001).", {
        autoClose: 1600,
      });
      updateRow(row.id, { codeError: true });
      return false;
    }

    const mergedIntoId = tryMergeDuplicate(code, row.id);
    if (mergedIntoId) return false;

    try {
      const url = `${API_BASE}/api/inventory/by-code/${encodeURIComponent(
        code
      )}`;

      const res = await axios.get(url, { headers: authHeaders });
      const item = res.data;

      updateRow(row.id, {
        name: item.name,
        costPrice: Number(item.costPrice) || 0,
        quantity: 0,
        locked: true,
        editing: false,
        codeError: false,
        qtyError: true,
        vendorError: true,
      });

      return true;
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Network error while fetching item.",
        { autoClose: 1800 }
      );
      updateRow(row.id, { codeError: true });
      return false;
    }
  };

  const handleItemCodeKeyDown = async (e, row) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = (row.itemCode || "").trim();

      if (!/^\d{5}$/.test(code)) {
        toast.error("Item code must be exactly 5 digits (e.g., 00001).", {
          autoClose: 1600,
        });
        updateRow(row.id, { codeError: true });
        return;
      }

      const ok = await fetchAndFillRow(row);

      if (ok) {
        updateRow(row.id, { locked: true, editing: false });
        setTimeout(() => focusQty(row.id), 30);
      }
    }

    if (e.key === "Escape") {
      updateRow(row.id, emptyRow(row.id));
      focusItemCode(row.id);
    }
  };

  const handleQtyChange = (rowId, value) => {
    const n = Math.max(0, Number(value) || 0);
    updateRow(rowId, {
      quantity: n,
      qtyError: n <= 0,
    });
  };

  const handleQtyKeyDown = (e, row) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setTimeout(() => focusVendor(row.id), 20);
    }
  };

  const handleVendorChange = (rowId, value) => {
    updateRow(rowId, {
      vendorId: value,
      vendorError: !value,
    });
  };

  const handleVendorKeyDown = (e, row) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (row.editing) {
        stopEditingRow(row.id);
      }

      const all = [...rows];
      const index = all.findIndex((r) => r.id === row.id);
      const nextRow = all[index + 1];

      if (nextRow) {
        setTimeout(() => focusItemCode(nextRow.id), 30);
      } else {
        insertEmptyRowAfter(row.id);
      }
    }
  };

  const loadVendors = async () => {
    try {
      setVendorsLoading(true);

      const res = await axios.get(`${API_BASE}/api/vendors`, {
        headers: authHeaders,
      });

      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];

      setVendors(list);
    } catch (e) {
      toast.error(
        e.response?.data?.message || "Network error while loading vendors.",
        { autoClose: 1800 }
      );
    } finally {
      setVendorsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [token]);

  useEffect(() => {
    focusItemCode(1);
  }, []);

  return (
    <div className="pi-card">
      <div className="pi-header">
        <h2 className="pi-title">Purchase Invoice</h2>
        <p className="pi-subtitle">
          Add items by code, choose vendor per item, and save invoice.
        </p>
      </div>

      <form ref={formRef}>
        <div className="pi-table-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Name</th>
                <th className="pi-text-right">Cost Price</th>
                <th className="pi-text-right">Quantity</th>
                <th>Vendor</th>
                <th className="pi-text-right">Total</th>
                <th className="pi-text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {computedRows.map((row, idx) => (
                <tr key={row.id}>
                  <td className="pi-text-center">{idx + 1}</td>

                  {/* ITEM CODE */}
                  <td>
                    <input
                      ref={(el) =>
                        (inputRefs.current[`itemCode-${row.id}`] = el)
                      }
                      className={`pi-input ${row.codeError ? "error" : ""}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={row.itemCode}
                      disabled={row.locked && !row.editing}
                      onChange={(e) => {
                        const onlyDigits5 = e.target.value
                          .replace(/\D+/g, "")
                          .slice(0, 5);
                        updateRow(row.id, { itemCode: onlyDigits5 });
                      }}
                      onKeyDown={(e) => handleItemCodeKeyDown(e, row)}
                    />
                  </td>

                  {/* NAME */}
                  <td>
                    <input className="pi-input" value={row.name} readOnly />
                  </td>

                  {/* COST PRICE */}
                  <td>
                    <input
                      className="pi-input pi-text-right"
                      value={fmt(row.costPrice)}
                      readOnly
                    />
                  </td>

                  {/* QTY */}
                  <td>
                    <input
                      ref={(el) => (inputRefs.current[`qty-${row.id}`] = el)}
                      className={`pi-input pi-text-right ${
                        row.qtyError ? "error" : ""
                      }`}
                      type="number"
                      min={0}
                      value={row.quantity}
                      disabled={!row.locked && !row.editing}
                      onChange={(e) => handleQtyChange(row.id, e.target.value)}
                      onKeyDown={(e) => handleQtyKeyDown(e, row)}
                    />
                  </td>

                  {/* VENDOR */}
                  <td>
                    <select
                      ref={(el) => (inputRefs.current[`vendor-${row.id}`] = el)}
                      className={`pi-input ${row.vendorError ? "error" : ""}`}
                      value={row.vendorId}
                      disabled={(!row.locked && !row.editing) || vendorsLoading}
                      onChange={(e) => handleVendorChange(row.id, e.target.value)}
                      onKeyDown={(e) => handleVendorKeyDown(e, row)}
                    >
                      <option value="">
                        {vendorsLoading ? "Loading..." : "Select vendor"}
                      </option>

                      {vendors.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.companyName || "Unnamed Vendor"}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* TOTAL */}
                  <td>
                    <input
                      className="pi-input pi-text-right"
                      value={fmt(row.lineTotal)}
                      readOnly
                    />
                  </td>

                  {/* ACTIONS */}
                  <td className="pi-actions-cell">
                    <Tippy content="Edit row" theme="material">
                      <button
                        type="button"
                        className="pi-icon-btn warn"
                        onClick={() => editRow(row.id)}
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </Tippy>

                    <Tippy content="Delete row" theme="material">
                      <button
                        type="button"
                        className="pi-icon-btn danger"
                        disabled={rows.length === 1}
                        onClick={() => removeRow(row.id)}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </Tippy>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="pi-totals">
          <div className="pi-totals-card">
            <div className="pi-total-row">
              <span className="label">Subtotal</span>
              <span className="value">{fmt(subTotal)}</span>
            </div>

            <div className="pi-total-row">
              <span className="label">Discount</span>
              <input
                className="pi-discount-input"
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="pi-total-row">
              <span className="label">
                <strong>Grand Total</strong>
              </span>
              <span className="value">
                <strong>{fmt(grandTotal)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pi-footer">
          <button
            type="button"
            className="pi-btn outline"
            onClick={() => {
              setRows([emptyRow(1)]);
              nextRowId.current = 2;
              setDiscount(0);
              setTimeout(() => focusItemCode(1), 30);
            }}
          >
            Reset
          </button>

          <button type="submit" className="pi-btn">
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
}