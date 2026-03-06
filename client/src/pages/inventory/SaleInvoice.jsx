import React, { useEffect, useMemo, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/material.css";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import { toast } from "react-toastify";
import axios from "axios";
import "./SaleInvoice.css";

const emptyRow = (id) => ({
  id,
  itemCode: "",
  name: "",
  salePrice: 0,
  quantity: 0,
  lineTotal: 0,
  locked: false,
  finalized: false,
  codeError: false,
  qtyError: false,
  editing: false,
});

const currency = "PKR";
const fmt = (n) => `${Number(n).toFixed(2)} ${currency}`;

export default function SaleInvoice() {
  const [rows, setRows] = useState([emptyRow(1)]);
  const [discount, setDiscount] = useState(0);

  // Customer Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const nextRowId = useRef(2);
  const inputRefs = useRef({});
  const formRef = useRef(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const API_BASE = "http://localhost:5000";

  // computed totals
  const computedRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        lineTotal: Number(r.salePrice || 0) * Number(r.quantity || 0),
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

  // focus helpers
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

  // row operations
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

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id, patch) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // edit a row
  const editRow = (id) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              editing: true,
              locked: false,
              finalized: false,
              codeError: false,
              qtyError: false,
            }
          : r
      )
    );
    setTimeout(() => focusItemCode(id), 20);
  };

  // merge duplicates
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

      toast.info(`Item ${itemCode} already in list — increased quantity.`);
      setTimeout(() => focusQty(existing.id), 40);
      return existing.id;
    }
    return null;
  };

  // fetch item details
  const fetchAndFillRow = async (row) => {
    const code = (row.itemCode || "").trim();

    if (!/^\d{5}$/.test(code)) {
      toast.error("Item code must be exactly 5 digits (e.g., 00001).", {
        autoClose: 1600,
      });
      updateRow(row.id, { codeError: true });
      return false;
    }

    const merged = tryMergeDuplicate(code, row.id);
    if (merged) return false;

    try {
      const url = `${API_BASE}/api/inventory/by-code/${encodeURIComponent(
        code
      )}`;
      const res = await axios.get(url, { headers: authHeaders });
      const item = res.data;

      updateRow(row.id, {
        name: item.name,
        salePrice: Number(item.rtPrice) || 0,
        quantity: 0,
        locked: true,
        finalized: false,
        editing: false,
        codeError: false,
        qtyError: true,
      });

      return true;
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Network error while fetching item."
      );
      updateRow(row.id, { codeError: true });
      return false;
    }
  };

  // key handlers
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
      if (ok) setTimeout(() => focusQty(row.id), 30);
    }
    if (e.key === "Escape") {
      updateRow(row.id, emptyRow(row.id));
      focusItemCode(row.id);
    }
  };

  const handleQtyKeyDown = (e, row) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddBelow(row.id);
    }
  };

  const handleQtyChange = (rowId, value) => {
    const n = Math.max(0, Number(value) || 0);
    updateRow(rowId, { quantity: n, qtyError: n <= 0 });
  };

  const handleAddBelow = (rowId) => {
    updateRow(rowId, { locked: true, finalized: true, editing: false });
    insertEmptyRowAfter(rowId);
  };

  // form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const codeErr = rows.find((r) => r.codeError);
    if (codeErr) {
      toast.error("Fix invalid item code before saving.", { autoClose: 1500 });
      focusItemCode(codeErr.id);
      return;
    }

    const qtyErr = rows.find((r) => r.locked && Number(r.quantity) <= 0);
    if (qtyErr) {
      toast.error("Quantity must be greater than 0.", { autoClose: 1500 });
      focusQty(qtyErr.id);
      return;
    }

    const items = computedRows
      .filter((r) => r.locked && r.itemCode && r.quantity > 0)
      .map((r) => ({
        itemCode: r.itemCode.trim(),
        name: r.name,
        salePrice: Number(r.salePrice),
        quantity: Number(r.quantity),
        lineTotal: Number(r.lineTotal),
      }));

    if (items.length === 0) {
      toast.error("Please add at least one item with quantity > 0.", {
        autoClose: 1600,
      });
      return;
    }

    const payload = {
      customerName,
      customerPhone,
      items,
      subTotal,
      discount: cleanedDiscount,
      grandTotal,
    };

    try {
      const url = `${API_BASE}/api/sales/invoices`;

      await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      toast.success("Purchase invoice saved successfully!", {
        autoClose: 1400,
      });

      // reset form
      setRows([emptyRow(1)]);
      nextRowId.current = 2;
      setDiscount(0);
      setCustomerName("");
      setCustomerPhone("");

      setTimeout(() => focusItemCode(1), 30);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving invoice.", {
        autoClose: 1800,
      });
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const allow = e.target?.getAttribute?.("data-allow-enter");
    if (allow !== "itemcode") e.preventDefault();
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key?.toLowerCase();
      const isSaveCombo =
        (e.ctrlKey && key === "s") ||
        (e.metaKey && key === "s") ||
        (e.altKey && key === "s");

      if (isSaveCombo) {
        e.preventDefault();
        if (
          formRef.current &&
          typeof formRef.current.requestSubmit === "function"
        ) {
          formRef.current.requestSubmit();
        } else if (formRef.current) {
          formRef.current.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    focusItemCode(1);
  }, []);

  return (
    <div className="si-card">
      <div className="si-header">
        <h2 className="si-title">Sale Invoice</h2>
        <p className="si-subtitle">Add items by code and save sale invoice.</p>
      </div>

      <div className="customer-section">
        <h3>Customer Info (Optional)</h3>

        <div className="customer-row">
          <input
            className="si-input"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            className="si-input"
            placeholder="Phone Number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        <div className="si-table-wrap">
          <table className="si-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Name</th>
                <th className="si-text-right">Sale Price</th>
                <th className="si-text-right">Qty</th>
                <th className="si-text-right">Total</th>
                <th className="si-text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {computedRows.map((row, idx) => (
                <tr key={row.id}>
                  <td className="si-text-center">{idx + 1}</td>

                  <td>
                    <input
                      ref={(el) =>
                        (inputRefs.current[`itemCode-${row.id}`] = el)
                      }
                      className={`si-input ${row.codeError ? "error" : ""}`}
                      type="text"
                      placeholder="00001"
                      value={row.itemCode}
                      maxLength={5}
                      data-allow-enter="itemcode"
                      disabled={!row.editing && row.locked}
                      onChange={(e) =>
                        updateRow(row.id, {
                          itemCode: e.target.value.replace(/\D+/g, "").slice(0, 5),
                        })
                      }
                      onKeyDown={(e) => handleItemCodeKeyDown(e, row)}
                    />
                  </td>

                  <td>
                    <input className="si-input" value={row.name} readOnly />
                  </td>

                  <td>
                    <input
                      className="si-input si-text-right"
                      value={fmt(row.salePrice)}
                      readOnly
                    />
                  </td>

                  <td>
                    <input
                      ref={(el) => (inputRefs.current[`qty-${row.id}`] = el)}
                      className={`si-input si-text-right ${
                        row.qtyError ? "error" : ""
                      }`}
                      type="number"
                      value={row.quantity}
                      disabled={!row.editing && (!row.locked || row.finalized)}
                      onChange={(e) => handleQtyChange(row.id, e.target.value)}
                      onKeyDown={(e) => handleQtyKeyDown(e, row)}
                    />
                  </td>

                  <td>
                    <input
                      className="si-input si-text-right"
                      value={fmt(row.lineTotal)}
                      readOnly
                    />
                  </td>

                  <td className="si-actions-cell">
                    <Tippy content="Edit row" theme="material">
                      <button
                        type="button"
                        className="si-icon-btn warn"
                        onClick={() => editRow(row.id)}
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </Tippy>

                    <Tippy content="Remove row" theme="material">
                      <button
                        type="button"
                        className="si-icon-btn danger"
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

        {/* Totals */}
        <div className="si-totals">
          <div className="si-totals-card">
            <div className="si-total-row">
              <span className="label">Subtotal</span>
              <span className="value">{fmt(subTotal)}</span>
            </div>

            <div className="si-total-row">
              <span className="label">Discount</span>
              <input
                className="si-discount-input"
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="si-total-row">
              <span className="label">
                <strong>Grand Total</strong>
              </span>
              <span className="value">
                <strong>{fmt(grandTotal)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="si-footer">
          <button
            type="button"
            className="si-btn outline"
            onClick={() => {
              setRows([emptyRow(1)]);
              nextRowId.current = 2;
              setDiscount(0);
              setCustomerName("");
              setCustomerPhone("");
              setTimeout(() => focusItemCode(1), 30);
            }}
          >
            Reset
          </button>

          <Tippy content="Save (Ctrl+S)" theme="material">
            <button type="submit" className="si-btn">
              Save Invoice
            </button>
          </Tippy>
        </div>
      </form>
    </div>
  );
}