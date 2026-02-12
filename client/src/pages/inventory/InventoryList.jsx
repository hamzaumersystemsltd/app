import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/material.css";
import "./InventoryList.css";
import { FiRefreshCw, FiLoader, FiEye, FiEdit2, FiTrash2, } from "react-icons/fi";

const API_BASE = "http://localhost:5000";

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  // Fetch inventory items
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/inventory`, {
        params: { page, limit, q: q || undefined },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (Array.isArray(res.data)) {
        setItems(res.data);
        setTotal(res.data.length);
      } else {
        setItems(res.data.items || []);
        setTotal(res.data.total ?? (res.data.items?.length || 0));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    await load();
    toast.success("Inventory refreshed", { autoClose: 1000 });
  };

  const handleDelete = (id) => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <strong>Are you sure you want to delete this item?</strong>
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <button
              onClick={async () => {
                closeToast();

                try {
                  await axios.delete(`${API_BASE}/api/inventory/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });

                  setItems((prev) => prev.filter((it) => it._id !== id));
                  setTotal((t) => Math.max(0, t - 1));

                  toast.success("Item deleted", { autoClose: 1200 });
                } catch (err) {
                  console.error(err);
                  toast.error(
                    err.response?.data?.message || "Failed to delete item"
                  );
                }
              }}
              className="btn danger"
            >
              Delete
            </button>

            <button onClick={closeToast} className="btn secondary">
              Cancel
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false }
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="inventorylist-card">
      {/* Header */}
      <div className="inventorylist-header">
        <div>
          <h3 className="inventorylist-title">Inventory List</h3>
          <p className="inventorylist-subtitle">
            Search, sort, and manage your items
          </p>
        </div>

        <div className="inventorylist-header-actions">
          <div className="inventorylist-search">
            <input
              className="input"
              placeholder="Search by name, code, category..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Refresh icon */}
          <Tippy
            content="Refresh"
            theme="material"
            delay={[150, 0]}
            placement="bottom"
          >
            <button
              type="button"
              onClick={handleRefresh}
              className="icon-button"
              aria-label="Refresh"
              disabled={loading}
            >
              {loading ? (
                <FiLoader size={18} className="spin" />
              ) : (
                <FiRefreshCw size={18} />
              )}
            </button>
          </Tippy>
        </div>
      </div>

      {/* Total + Per page */}
      <div className="inventorylist-actions">
        <div className="inventorylist-total">
          <strong>Total:</strong> {total}
        </div>

        <div className="inventorylist-perpage">
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
              <th>Item Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>WS</th>
              <th>RT</th>
              <th>Cost</th>
              <th>Qty</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="row-center">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="8" className="row-center">
                  No inventory found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id}>
                  <td>{item.itemCode}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.wsPrice}</td>
                  <td>{item.rtPrice}</td>
                  <td>{item.costPrice}</td>
                  <td>{item.stockQuantity}</td>

                  <td>
                    <div className="actions icons">
                      <Tippy content="View" theme="material">
                        <Link
                          to={`/inventory/view/${item._id}`}
                          className="icon-button info"
                        >
                          <FiEye size={18} />
                        </Link>
                      </Tippy>

                      <Tippy content="Edit" theme="material">
                        <Link
                          to={`/inventory/edit/${item._id}`}
                          className="icon-button warn"
                        >
                          <FiEdit2 size={18} />
                        </Link>
                      </Tippy>

                      <Tippy content="Delete" theme="material">
                        <button
                          className="icon-button danger"
                          onClick={() => handleDelete(item._id)}
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
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>

        <button
          className="button outline"
          onClick={() =>
            setPage((p) => Math.min(totalPages, p + 1))
          }
          disabled={page >= totalPages || loading}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}