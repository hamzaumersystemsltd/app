import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./VendorList.css";

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

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
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
              style={{
                padding: "6px 10px",
                backgroundColor: "#d9534f",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>

            <button
              onClick={closeToast}
              style={{
                padding: "6px 10px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
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
    <div className="vendorlist-page">
      <div className="vendorlist-card">
        {/* Header */}
        <div className="vendorlist-header">
          <div>
            <h3 className="vendorlist-title">Vendor List</h3>
            <p className="vendorlist-subtitle">
              Search, filter and manage all vendors.
            </p>
          </div>

          <form className="vendorlist-search" onSubmit={handleSearch}>
            <input
              className="input"
              placeholder="Search by vendor ID, name, company..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="button outline" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
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
                <th style={{ width: 260 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="row-center">
                    Loading...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="row-center">
                    No vendors found.
                  </td>
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
                      <div className="actions">
                        <Link
                          to={`/vendor/view/${v._id}`}
                          className="button sm info"
                        >
                          View
                        </Link>

                        <Link
                          to={`/vendor/edit/${v._id}`}
                          className="button sm warn"
                        >
                          Edit
                        </Link>

                        <button
                          className="button sm danger"
                          onClick={() => handleDelete(v._id)}
                        >
                          Delete
                        </button>
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
    </div>
  );
}