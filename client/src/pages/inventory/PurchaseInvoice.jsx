import React, { useEffect, useMemo, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/material.css";
import { FiTrash2, FiEdit2, FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./purchaseinvoice.css";

const emptyRow = (id) => ({
  id,
  itemCode: "",
  name: "",
  costPrice: 0,
  quantity: 0,
  lineTotal: 0,
  locked: false,
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
  const focusAddBtn = (rowId) => focusRef(`btn-add-${rowId}`);

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
    updateRow(id, {
      locked: false,
      name: "",
      costPrice: 0,
      quantity: 0,
      lineTotal: 0,
      itemCode: "",
      vendorId: "",
      codeError: false,
      qtyError: false,
      vendorError: false,
    });
    setTimeout(() => focusItemCode(id), 20);
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
      const url = `${API_BASE}/api/inventory/by-code/${encodeURIComponent(code)}`;

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
          toast.error(errJson?.message || `Error fetching item ${code}.`, {
            autoClose: 1800,
          });
        } else {
          const t = await res.text().catch(() => "");
          toast.error(`Fetch error (${res.status}). ${t.slice(0, 120)}...`, {
            autoClose: 1800,
          });
        }
        updateRow(row.id, { codeError: true });
        return false;
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const html = await res.text();
        console.error("Non-JSON response:", html.slice(0, 200));
        toast.error("Unexpected server response (not JSON).", {
          autoClose: 1800,
        });
        updateRow(row.id, { codeError: true });
        return false;
      }

      const item = await res.json();

      updateRow(row.id, {
        name: item.name,
        costPrice: Number(item.costPrice) || 0,
        quantity: 0,
        locked: true,
        codeError: false,
        qtyError: true,
        vendorError: true,
      });

      return true;
    } catch (err) {
      console.error(err);
      toast.error("Network error while fetching item.", { autoClose: 1800 });
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
      setTimeout(() => focusAddBtn(row.id), 20);
    }
  };

  const handleAddBelow = (rowId) => {
    updateRow(rowId, { locked: true });
    insertEmptyRowAfter(rowId);
  };

  const handleAddBtnKeyDown = (e, rowId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddBelow(rowId);
    }
  };

  const loadVendors = async () => {
    try {
      setVendorsLoading(true);
      const res = await fetch(`${API_BASE}/api/vendors`, {
        method: "GET",
        headers: {
          ...authHeaders,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.message || "Failed to load vendors", { autoClose: 1800 });
        } else {
          const t = await res.text().catch(() => "");
          toast.error(`Vendors error (${res.status}): ${t.slice(0, 120)}...`, {
            autoClose: 1800,
          });
        }
        return;
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const html = await res.text();
        console.error("Vendors non-JSON:", html.slice(0, 200));
        toast.error("Unexpected vendor list response (not JSON).", {
          autoClose: 1800,
        });
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setVendors(list);
    } catch (e) {
      console.error(e);
      toast.error("Network error while loading vendors.", { autoClose: 1800 });
    } finally {
      setVendorsLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const codeErr = rows.find((r) => r.codeError);
    if (codeErr) {
      toast.error("Fix invalid item code before saving.", { autoClose: 1500 });
      setTimeout(() => focusItemCode(codeErr.id), 20);
      return;
    }
    const qtyErr = rows.find((r) => r.locked && Number(r.quantity) <= 0);
    if (qtyErr) {
      toast.error("Quantity must be greater than 0.", { autoClose: 1500 });
      setTimeout(() => focusQty(qtyErr.id), 20);
      return;
    }
    const vendorErr = rows.find(
      (r) => r.locked && Number(r.quantity) > 0 && !r.vendorId
    );
    if (vendorErr) {
      toast.error("Please select a vendor for each item.", { autoClose: 1500 });
      updateRow(vendorErr.id, { vendorError: true });
      setTimeout(() => focusVendor(vendorErr.id), 20);
      return;
    }

    const items = computedRows
      .filter((r) => r.locked && r.itemCode && r.quantity > 0)
      .map((r) => ({
        itemCode: r.itemCode.trim(),
        name: r.name,
        costPrice: Number(r.costPrice),
        quantity: Number(r.quantity),
        lineTotal: Number(r.lineTotal),
        vendorId: r.vendorId || null,
      }));

    if (items.length === 0) {
      toast.error("Please add at least one item with quantity > 0.", {
        autoClose: 1600,
      });
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
          toast.error(errJson?.message || "Failed to save invoice.", {
            autoClose: 1800,
          });
        } else {
          const t = await res.text().catch(() => "");
          toast.error(`Save error (${res.status}): ${t.slice(0, 120)}...`, {
            autoClose: 1800,
          });
        }
        return;
      }

      toast.success("Purchase invoice saved successfully!", {
        autoClose: 1400,
      });

      setRows([emptyRow(1)]);
      nextRowId.current = 2;
      setDiscount(0);
      setTimeout(() => focusItemCode(1), 30);
    } catch (err) {
      console.error(err);
      toast.error("Error saving invoice.", { autoClose: 1800 });
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
        if (formRef.current && typeof formRef.current.requestSubmit === "function") {
          formRef.current.requestSubmit();
        } else if (formRef.current) {
          formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
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
    <div className="pi-card">
      <div className="pi-header">
        <h2 className="pi-title">Purchase Invoice</h2>
        <p className="pi-subtitle">
          Add items by code, choose vendor per item, and save invoice.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
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

                  <td>
                    <input
                      ref={(el) => (inputRefs.current[`itemCode-${row.id}`] = el)}
                      className={`pi-input ${row.codeError ? "error" : ""}`}
                      type="text"
                      data-allow-enter="itemcode"
                      placeholder="Item code (00001)"
                      inputMode="numeric"
                      pattern="[0-9]{5}"
                      maxLength={5}
                      value={row.itemCode}
                      disabled={row.locked}
                      onChange={(e) => {
                        const onlyDigits5 = e.target.value
                          .replace(/\D+/g, "")
                          .slice(0, 5);
                        updateRow(row.id, { itemCode: onlyDigits5 });
                      }}
                      onKeyDown={(e) => handleItemCodeKeyDown(e, row)}
                    />
                  </td>

                  <td>
                    <input className="pi-input" value={row.name} readOnly />
                  </td>

                  <td>
                    <input
                      className="pi-input pi-text-right"
                      value={fmt(row.costPrice)}
                      readOnly
                    />
                  </td>

                  <td>
                    <input
                      ref={(el) => (inputRefs.current[`qty-${row.id}`] = el)}
                      className={`pi-input pi-text-right ${row.qtyError ? "error" : ""}`}
                      type="number"
                      min={0}
                      value={row.quantity}
                      disabled={!row.locked}
                      onChange={(e) => handleQtyChange(row.id, e.target.value)}
                      onKeyDown={(e) => handleQtyKeyDown(e, row)}
                    />
                  </td>

                  <td>
                    <select
                      ref={(el) => (inputRefs.current[`vendor-${row.id}`] = el)}
                      className={`pi-input ${row.vendorError ? "error" : ""}`}
                      value={row.vendorId}
                      disabled={!row.locked || vendorsLoading}
                      onChange={(e) => handleVendorChange(row.id, e.target.value)}
                      onKeyDown={(e) => handleVendorKeyDown(e, row)}
                    >
                      <option value="">
                        {vendorsLoading ? "Loading vendors..." : "Select vendor"}
                      </option>
                      {vendors.map((v) => {
                        const id = v._id;
                        const name = v.companyName || "Unnamed Vendor";
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </td>

                  <td>
                    <input
                      className="pi-input pi-text-right"
                      value={fmt(row.lineTotal)}
                      readOnly
                    />
                  </td>

                  <td className="pi-actions-cell">
                    <Tippy content="Add row" theme="material" delay={[150, 0]}>
                      <button
                        ref={(el) => (inputRefs.current[`btn-add-${row.id}`] = el)}
                        type="button"
                        className="pi-icon-btn info"
                        aria-label="Add row"
                        onClick={() => handleAddBelow(row.id)}
                        onKeyDown={(e) => handleAddBtnKeyDown(e, row.id)}
                      >
                        <FiPlus size={18} />
                      </button>
                    </Tippy>

                    <Tippy content="Edit row" theme="material" delay={[150, 0]}>
                      <button
                        ref={(el) => (inputRefs.current[`btn-edit-${row.id}`] = el)}
                        type="button"
                        className="pi-icon-btn warn"
                        aria-label="Edit row"
                        onClick={() => editRow(row.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            editRow(row.id);
                          }
                        }}
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </Tippy>

                    <Tippy content="Remove row" theme="material" delay={[150, 0]}>
                      <button
                        ref={(el) => (inputRefs.current[`btn-del-${row.id}`] = el)}
                        type="button"
                        className="pi-icon-btn danger"
                        disabled={rows.length === 1}
                        aria-label="Remove row"
                        onClick={() => removeRow(row.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            removeRow(row.id);
                          }
                        }}
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
        <div className="pi-totals">
          <div className="pi-totals-card">
            <div className="pi-total-row">
              <span className="label">Subtotal</span>
              <span className="value">{fmt(subTotal)}</span>
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
                <strong>{fmt(grandTotal)}</strong>
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

          <Tippy content="Save (Ctrl+S / Cmd+S / Alt+S)" theme="material">
            <button type="submit" className="pi-btn">
              Save Invoice
            </button>
          </Tippy>
        </div>
      </form>
    </div>
  );
}