import { useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import "./InventoryList.css";
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
import ThumbnailImage from "../../components/listing/ThumbnailImage";

const API_BASE = "http://localhost:5000";
const currency = "PKR";

export default function InventoryList() {
  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  const {
    items,
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
    url: `${API_BASE}/api/inventory`,
    initialPage: 1,
    initialLimit: 10,
    initialFilters: { q: "" },
    token,
  });

  const handleRefresh = async () => {
    await reload();
    toast.success("Inventory refreshed", { autoClose: 1000 });
  };

  const handleDelete = (id) => {
    confirmToast({
      title: "Are you sure you want to delete this item?",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE}/api/inventory/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          await reload();
          toast.success("Item deleted", { autoClose: 1200 });
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || "Failed to delete item");
        }
      },
    });
  };

  return (
    <div className="inventorylist-card">
      {/* Header */}
      <div className="inventorylist-header">
        <div>
          <h3 className="inventorylist-title">Inventory List</h3>
          <p className="inventorylist-subtitle">Search, sort, and manage your items</p>
        </div>

        <div className="inventorylist-header-actions">
          <div className="inventorylist-search">
            <SearchInput
              value={filters.q || ""}
              onChange={(v) => {
                setFilter("q", v);
                setPage(1);
              }}
              placeholder="Search by name, code, category..."
            />
          </div>

          <RefreshButton loading={loading} onClick={handleRefresh} />
        </div>
      </div>

      {/* Total + Per page */}
      <div className="inventorylist-actions">
        <div className="inventorylist-total">
          <strong>Total:</strong> {total}
        </div>

        <div className="inventorylist-perpage">
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
            <TH>Image</TH>
            <TH>Item ID</TH>
            <TH>Name</TH>
            <TH>Category</TH>
            <TH>Wholesale</TH>
            <TH>Retail</TH>
            <TH>Cost</TH>
            <TH>Quantity</TH>
            <TH style={{ width: 160 }}>Actions</TH>
          </TRow>
        </THead>

        <TBody>
          {loading ? (
            <LoadingRow colSpan={9} />
          ) : items.length === 0 ? (
            <EmptyRow colSpan={9} text="No inventory found." />
          ) : (
            items.map((item) => (
              <TRow key={item._id}>
                <TCell align="center">
                  <ThumbnailImage src={item?.image} alt={item?.name ? `${item.name} image` : "item image"} />
                </TCell>

                <TCell>{item.itemCode}</TCell>
                <TCell>{item.name}</TCell>
                <TCell>{item.category}</TCell>
                <TCell>{item.wsPrice} {currency}</TCell>
                <TCell>{item.rtPrice} {currency}</TCell>
                <TCell>{item.costPrice} {currency}</TCell>
                <TCell>{item.stockQuantity}</TCell>

                <TCell>
                  <div className="actions icons">
                    <ActionButton title="View" variant="info">
                      <Link to={`/inventory/inventory-list/${item._id}`}>
                        <FiEye size={18} />
                      </Link>
                    </ActionButton>

                    <ActionButton title="Edit" variant="warn">
                      <Link to={`/inventory/inventory-list/${item._id}/edit`}>
                        <FiEdit2 size={18} />
                      </Link>
                    </ActionButton>

                    <ActionButton title="Delete" variant="danger" onClick={() => handleDelete(item._id)}>
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