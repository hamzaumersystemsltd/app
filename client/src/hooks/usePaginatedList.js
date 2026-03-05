import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

function useDebouncedCallback(fn, delay = 350) {
  const t = useRef();
  return useCallback((...args) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function usePaginatedList({
  url,
  initialPage = 1,
  initialLimit = 10,
  initialFilters = {},
  token,
  mapResponse,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / (limit || 1))),
    [total, limit]
  );

  const params = useMemo(() => {
    const p = { page, limit };
    Object.entries(filters || {}).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) p[k] = v;
    });
    return p;
  }, [page, limit, filters]);

  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(url, { params, headers });
      if (mapResponse) {
        const { items: its, total: tot } = mapResponse(res.data);
        setItems(Array.isArray(its) ? its : []);
        setTotal(Number.isFinite(tot) ? tot : (its?.length || 0));
      } else {
        // Try to infer common shapes: array or {items,total}
        if (Array.isArray(res.data)) {
          setItems(res.data);
          setTotal(res.data.length);
        } else {
          setItems(res.data.items || []);
          setTotal(
            Number.isFinite(res.data.total)
              ? res.data.total
              : (res.data.items?.length || 0)
          );
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [url, params, headers, mapResponse]);

  // Debounce whenever filters change
  const debouncedLoad = useDebouncedCallback(load, 350);

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      debouncedLoad();
    } else {
      load();
    }
  }, [load, debouncedLoad, filters, page, limit]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const reload = useCallback(() => load(), [load]);

  return {
    items,
    total,
    page,
    setPage,
    limit,
    setLimit,
    filters,
    setFilter,
    setFilters,
    resetFilters,
    loading,
    error,
    totalPages,
    reload,
  };
}