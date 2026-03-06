import { useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiTrash2 } from "react-icons/fi";
import "./SaleInvoiceList.css";
import usePaginatedList from "../../hooks/usePaginatedList";
import SearchInput from "../../components/listing/SearchInput";
import DateRangePicker from "../../components/listing/DateRangePicker";
import PerPageSelector from "../../components/listing/PerPageSelector";
import { Table, THead, TBody, TRow, TH, TCell } from "../../components/listing/Table";
import LoadingRow from "../../components/listing/LoadingRow";
import EmptyRow from "../../components/listing/EmptyRow";
import ActionButton from "../../components/listing/ActionButton";
import RefreshButton from "../../components/listing/RefreshButton";
import PaginationBar from "../../components/listing/PaginationBar";
import { confirmToast } from "../../components/listing/confirmToast";
import { formatMoney, formatDate } from "../../utils/format";

const API_BASE = "http://localhost:5000";
const CURRENCY = "PKR";

export default function SaleInvoiceList() {
  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
    []
  );

  const {
    items: invoices,
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
    url: `${API_BASE}/api/sales/invoices`,
    initialPage: 1,
    initialLimit: 10,
    initialFilters: { search: "", dateFrom: "", dateTo: "" },
    token,
  });

  const handleRefresh = async () => {
    await reload();
    toast.success("Invoices refreshed", { autoClose: 900 });
  };

  const handleDelete = (invId, display = "") => {
    confirmToast({
      title: `Delete invoice ${display ? `#${display}` : ""}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_BASE}/api/sales/invoices/${invId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          await reload();
          toast.success("Invoice deleted", { autoClose: 1200 });
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || "Failed to delete invoice");
        }
      },
    });
  };

  const customerSummary = (inv) => inv.customerName?.trim() || "-";
  const itemsCount = (inv) => (inv.items ? inv.items.length : 0);

  return (
    <div className="invoice-card">
      {/* Header */}
      <div className="invoice-header">
        <div>
          <h3 className="invoice-title">Sale Invoices</h3>
          <p className="invoice-subtitle">Search, filter, and view all sale invoices</p>
        </div>

        <div className="invoice-header-actions">
          <div className="invoice-search">
            <SearchInput
              value={filters.search || ""}
              onChange={(v) => {
                setFilter("search", v);
                setPage(1);
              }}
              placeholder="Search by invoice no, item or customer..."
            />

            <DateRangePicker
              from={filters.dateFrom}
              to={filters.dateTo}
              onFromChange={(v) => {
                setFilter("dateFrom", v);
                setPage(1);
              }}
              onToChange={(v) => {
                setFilter("dateTo", v);
                setPage(1);
              }}
            />
          </div>

          <RefreshButton loading={loading} onClick={handleRefresh} />
        </div>
      </div>

      {/* Total + Per page */}
      <div className="invoice-actions">
        <div className="invoice-total">
          <strong>Total:</strong> {total}
        </div>

        <div className="invoice-perpage">
          <PerPageSelector
            value={limit}
            onChange={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <THead>
          <TRow>
            <TH>#</TH>
            <TH>Invoice No</TH>
            <TH>Date</TH>
            <TH>Subtotal</TH>
            <TH>Discount</TH>
            <TH>Grand Total</TH>
            <TH>Customer</TH>
            <TH>Items</TH>
            <TH style={{ width: 120 }}>Actions</TH>
          </TRow>
        </THead>

        <TBody>
          {loading ? (
            <LoadingRow colSpan={9} />
          ) : invoices.length === 0 ? (
            <EmptyRow colSpan={9} text="No invoices found." />
          ) : (
            invoices.map((inv, idx) => (
              <TRow key={inv._id}>
                <TCell>{(page - 1) * limit + (idx + 1)}</TCell>
                <TCell>
                  <strong>#{inv.invoiceNo ?? "-"}</strong>
                </TCell>
                <TCell>{formatDate(inv.createdAt)}</TCell>
                <TCell>{formatMoney(inv.subTotal, CURRENCY)}</TCell>
                <TCell>{formatMoney(inv.discount, CURRENCY)}</TCell>
                <TCell>
                  <strong>{formatMoney(inv.grandTotal, CURRENCY)}</strong>
                </TCell>
                <TCell>{customerSummary(inv)}</TCell>
                <TCell>{itemsCount(inv)}</TCell>
                <TCell>
                  <div className="actions">
                    <ActionButton title="View" variant="info">
                      <Link to={`/inventory/sale-invoices/${inv._id}`} aria-label="View">
                        <FiEye size={18} />
                      </Link>
                    </ActionButton>

                    <ActionButton
                      title="Delete"
                      variant="danger"
                      onClick={() => handleDelete(inv._id, inv.invoiceNo)}
                    >
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