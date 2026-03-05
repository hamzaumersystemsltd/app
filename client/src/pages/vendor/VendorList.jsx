import { useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import "./VendorList.css";
import usePaginatedList from "../../hooks/usePaginatedList";
import SearchInput from "../../components/listing/SearchInput";
import PerPageSelector from "../../components/listing/PerPageSelector";
import { Table, THead, TBody, TRow, TH, TCell } from "../../components/listing/Table";
import LoadingRow from "../../components/listing/LoadingRow";
import EmptyRow from "../../components/listing/EmptyRow";
import ActionButton from "../../components/listing/ActionButton";
import RefreshButton from "../../components/listing/RefreshButton";
import PaginationBar from "../../components/listing/PaginationBar";
import { confirmToast } from "../../components/listing/confirmToast";

const API_BASE = "http://localhost:5000";

export default function VendorList() {
  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  const {
    items: vendors,
    total,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    setFilter,
    loading,
    totalPages,
    reload,
  } = usePaginatedList({
    url: `${API_BASE}/api/vendors`,
    initialPage: 1,
    initialLimit: 10,
    initialFilters: { q: "" },
    token,
  });

  const handleRefresh = async () => {
    await reload();
    toast.success("Vendor list refreshed", { autoClose: 1000 });
  };

  const handleDelete = (id) => {
    confirmToast({
      title: "Are you sure you want to delete this vendor?",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE}/api/vendors/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          await reload();
          toast.success("Vendor deleted", { autoClose: 1500 });
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || "Failed to delete vendor");
        }
      },
    });
  };

  return (
    <div className="vendorlist-card">
      {/* Header */}
      <div className="vendorlist-header">
        <div>
          <h3 className="vendorlist-title">Vendor List</h3>
          <p className="vendorlist-subtitle">Search, filter and manage all vendors.</p>
        </div>

        <div className="vendorlist-header-actions">
          <div className="vendorlist-search">
            <SearchInput
              value={filters.q || ""}
              onChange={(v) => {
                setFilter("q", v);
                setPage(1);
              }}
              placeholder="Search by vendor ID, name, company..."
            />
          </div>

          <RefreshButton loading={loading} onClick={handleRefresh} />
        </div>
      </div>

      {/* Total + Per page */}
      <div className="vendorlist-actions">
        <div className="vendorlist-total">
          <strong>Total:</strong> {total}
        </div>

        <div className="vendorlist-perpage">
          <PerPageSelector
            value={limit}
            onChange={(n) => { setLimit(n); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <THead>
          <TRow>
            <TH>Vendor ID</TH>
            <TH>Name</TH>
            <TH>Company</TH>
            <TH>Email</TH>
            <TH>Phone</TH>
            <TH>City</TH>
            <TH>Status</TH>
            <TH style={{ width: 160 }}>Actions</TH>
          </TRow>
        </THead>

        <TBody>
          {loading ? (
            <LoadingRow colSpan={8} />
          ) : vendors.length === 0 ? (
            <EmptyRow colSpan={8} text="No vendors found." />
          ) : (
            vendors.map((v) => (
              <TRow key={v._id}>
                <TCell>{v.vendorId}</TCell>
                <TCell>{v.name}</TCell>
                <TCell>{v.companyName || "-"}</TCell>
                <TCell>{v.email || "-"}</TCell>
                <TCell>{v.phone || "-"}</TCell>
                <TCell>{v.city || "-"}</TCell>
                <TCell>{v.status}</TCell>
                <TCell>
                  <div className="actions icons">
                    <ActionButton title="View" variant="info">
                      <Link to={`/vendor/vendor-list/${v._id}`}>
                        <FiEye size={18} />
                      </Link>
                    </ActionButton>

                    <ActionButton title="Edit" variant="warn">
                      <Link to={`/vendor/vendor-list/${v._id}/edit`}>
                        <FiEdit2 size={18} />
                      </Link>
                    </ActionButton>

                    <ActionButton title="Delete" variant="danger" onClick={() => handleDelete(v._id)}>
                      <FiTrash2 size={18} />
                    </ActionButton>
                  </div>
                </TCell>
              </TRow>
            ))
          )}
        </TBody>
      </Table>

      {/* Pagination */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        loading={loading}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
}