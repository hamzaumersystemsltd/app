import React, { useEffect, useMemo, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/material.css";
import { FiTrash2 } from "react-icons/fi";
import "./purchaseinvoice.css";

const emptyRow = (id) => ({
  id,
  itemCode: "",
  name: "",
  costPrice: 0,
  quantity: 1,
  lineTotal: 0,
  locked: false,
});

export default function PurchaseInvoice() {
  const [rows, setRows] = useState([emptyRow(1)]);
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState(null);

  const nextRowId = useRef(2);
  const inputRefs = useRef({});

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const API_BASE = "http://localhost:5000";

  const computedRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        lineTotal: Number(r.quantity) * Number(r.costPrice || 0),
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

  const focusItemCode = (rowId) => {
    const ref = inputRefs.current[`itemCode-${rowId}`];
    if (ref && ref.focus) ref.focus();
  };

  const addEmptyRow = () => {
    const id = nextRowId.current++;
    setRows((prev) => [...prev, emptyRow(id)]);
    setTimeout(() => focusItemCode(id), 30);
  };

  const removeRow = (id) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
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
              ? { ...r, quantity: Number(r.quantity) + 1 }
              : r
          )
          .filter((r) => r.id !== id)
      );

      setMessage(
        `Item ${itemCode} already in list — quantity increased automatically.`
      );

      return true;
    }
    return false;
  };

  const fetchAndFillRow = async (row) => {
    const code = row.itemCode.trim();
    if (!code) return;

    if (tryMergeDuplicate(code, row.id)) return;

    try {
      setMessage(null);

      const url = `${API_BASE}/api/inventory/by-code/${encodeURIComponent(
        code
      )}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...authHeaders,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const errJson = await res.json().catch(() => ({}));
          setMessage(errJson?.message || "Error fetching item.");
        } else {
          const t = await res.text().catch(() => "");
          setMessage(
            `Fetch error (${res.status}). ${t.slice(0, 120)}...`
          );
        }
        return;
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const html = await res.text();
        console.error("Non-JSON:", html.slice(0, 200));
        setMessage("Unexpected server response (not JSON)");
        return;
      }

      const item = await res.json();

      updateRow(row.id, {
        name: item.name,
        costPrice: Number(item.costPrice) || 0,
        quantity: 1,
        locked: true,
      });

      addEmptyRow();
    } catch (err) {
      console.error(err);
      setMessage("Network error while fetching item.");
    }
  };

  const handleItemCodeKeyDown = (e, row) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchAndFillRow(row);
    }
    if (e.key === "Escape") {
      updateRow(row.id, emptyRow(row.id));
      focusItemCode(row.id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const items = computedRows
      .filter((r) => r.locked && r.itemCode && r.quantity > 0)
      .map((r) => ({
        itemCode: r.itemCode.trim(),
        name: r.name,
        costPrice: Number(r.costPrice),
        quantity: Number(r.quantity),
        lineTotal: Number(r.lineTotal),
      }));

    if (items.length === 0) {
      setMessage("Add at least one valid item.");
      return;
    }

    const payload = {
      items,
      subTotal,
      discount: cleanedDiscount,
      grandTotal,
    };

    try {
      const url = `${API_BASE}/api/purchases/invoices`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const errJson = await res.json().catch(() => ({}));
          setMessage(errJson?.message || "Failed to save invoice.");
        } else {
          const t = await res.text().catch(() => "");
          setMessage(`Save error (${res.status}): ${t.slice(0, 120)}...`);
        }
        return;
      }

      setMessage("Purchase invoice saved successfully!");

      // Reset
      setRows([emptyRow(1)]);
      nextRowId.current = 2;
      setDiscount(0);
      setTimeout(() => focusItemCode(1), 30);
    } catch (err) {
      console.error(err);
      setMessage("Error saving invoice.");
    }
  };

  // Only allow Enter in item code fields that have data-allow-enter="itemcode"
  const handleFormKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const allow = e.target?.getAttribute?.("data-allow-enter");
    if (allow !== "itemcode") e.preventDefault();
  };

  useEffect(() => {
    focusItemCode(1);
  }, []);

  return (
    <div className="pi-card">
      <div className="pi-header">
        <h2 className="pi-title">Purchase Invoice</h2>
        <p className="pi-subtitle">
          Add items by code, auto-fill details, and save invoice.
        </p>
      </div>

      {message && <div className="pi-alert">{message}</div>}

      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        <div className="pi-table-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Name</th>
                <th className="pi-text-right">Cost Price</th>
                <th className="pi-text-right">Quantity</th>
                <th className="pi-text-right">Total</th>
                <th className="pi-text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {computedRows.map((row, idx) => (
                <tr key={row.id}>
                  <td className="pi-text-center">{idx + 1}</td>

                  <td>
                    <input
                      ref={(el) =>
                        (inputRefs.current[`itemCode-${row.id}`] = el)
                      }
                      className="pi-input"
                      type="text"
                      data-allow-enter="itemcode"
                      placeholder="Item code (00001)"
                      value={row.itemCode}
                      disabled={row.locked}
                      onChange={(e) =>
                        updateRow(row.id, { itemCode: e.target.value })
                      }
                      onKeyDown={(e) => handleItemCodeKeyDown(e, row)}
                    />
                  </td>

                  <td>
                    <input className="pi-input" value={row.name} readOnly />
                  </td>

                  <td>
                    <input
                      className="pi-input pi-text-right"
                      value={row.costPrice}
                      readOnly
                    />
                  </td>

                  <td>
                    <input
                      className="pi-input pi-text-right"
                      type="number"
                      min={1}
                      value={row.quantity}
                      disabled={!row.locked}
                      onChange={(e) =>
                        updateRow(row.id, {
                          quantity: Number(e.target.value) || 1,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                    />
                  </td>

                  <td>
                    <input
                      className="pi-input pi-text-right"
                      value={row.lineTotal}
                      readOnly
                    />
                  </td>

                  <td className="pi-actions-cell">
                    <Tippy content="Remove row" theme="material" delay={[150, 0]}>
                      <button
                        type="button"
                        className="pi-icon-btn danger"
                        disabled={rows.length === 1}
                        aria-label="Remove row"
                        onClick={() => removeRow(row.id)}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </Tippy>
                  </td>
                </tr>
              ))}

              <tr>
                <td colSpan="7" style={{ paddingTop: 8 }}>
                  <button
                    type="button"
                    className="pi-btn outline"
                    onClick={addEmptyRow}
                  >
                    + Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pi-totals">
          <div className="pi-totals-card">
            <div className="pi-total-row">
              <span className="label">Subtotal</span>
              <span className="value">{subTotal.toFixed(2)}</span>
            </div>

            <div className="pi-total-row">
              <span className="label">
                Discount <small className="pi-muted">(applies to subtotal)</small>
              </span>

              <input
                className="pi-discount-input"
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </div>

            <div className="pi-total-row">
              <span className="label">
                <strong>Grand Total</strong>
              </span>
              <span className="value">
                <strong>{grandTotal.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>

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