import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/material.css";
import "./VendorList.css";
import { FiRefreshCw, FiLoader, FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

const API_BASE = "http://localhost:5000";

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/api/vendors`, {
        params: { page, limit, q: q || undefined },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (Array.isArray(res.data)) {
        setVendors(res.data);
        setTotal(res.data.length);
      } else {
        setVendors(res.data.items || []);
        setTotal(res.data.total ?? (res.data.items?.length || 0));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  }, [page, limit, q, token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    await load();
    toast.success("Vendor list refreshed", { autoClose: 1000 });
  };

  const handleDelete = (id) => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <strong>Are you sure you want to delete this vendor?</strong>

          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <button
              onClick={async () => {
                closeToast();
                try {
                  await axios.delete(`${API_BASE}/api/vendors/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  });

                  setVendors((prev) => prev.filter((v) => v._id !== id));
                  setTotal((t) => Math.max(0, t - 1));

                  toast.success("Vendor deleted", { autoClose: 1500 });
                } catch (err) {
                  console.error(err);
                  toast.error(err.response?.data?.message || "Failed to delete vendor");
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
    <div className="vendorlist-card">
      {/* Header */}
      <div className="vendorlist-header">
        <div>
          <h3 className="vendorlist-title">Vendor List</h3>
          <p className="vendorlist-subtitle">
            Search, filter and manage all vendors.
          </p>
        </div>

        <div className="vendorlist-header-actions">
          <div className="vendorlist-search">
            <input
              className="input"
              placeholder="Search by vendor ID, name, company..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Refresh */}
          <Tippy content="Refresh" theme="material" placement="bottom" delay={[150, 0]}>
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
      <div className="vendorlist-actions">
        <div className="vendorlist-total">
          <strong>Total:</strong> {total}
        </div>

        <div className="vendorlist-perpage">
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

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Vendor ID</th>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Status</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="row-center">Loading...</td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan="8" className="row-center">No vendors found.</td>
              </tr>
            ) : (
              vendors.map((v) => (
                <tr key={v._id}>
                  <td>{v.vendorId}</td>
                  <td>{v.name}</td>
                  <td>{v.companyName || "-"}</td>
                  <td>{v.email || "-"}</td>
                  <td>{v.phone || "-"}</td>
                  <td>{v.city || "-"}</td>
                  <td>{v.status}</td>
                  <td>
                    <div className="actions icons">
                      {/* View */}
                      <Tippy content="View" theme="material">
                        <Link to={`/vendor/view/${v._id}`} className="icon-button info">
                          <FiEye size={18} />
                        </Link>
                      </Tippy>

                      {/* Edit */}
                      <Tippy content="Edit" theme="material">
                        <Link to={`/vendor/edit/${v._id}`} className="icon-button warn">
                          <FiEdit2 size={18} />
                        </Link>
                      </Tippy>

                      {/* Delete */}
                      <Tippy content="Delete" theme="material">
                        <button
                          className="icon-button danger"
                          onClick={() => handleDelete(v._id)}
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
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}