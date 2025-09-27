"use client";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { DatePicker } from "@/components/DatePicker";
import { Input } from "@/components/ui/input";
import { PlcLogTable } from "@/components/PlcLogTable";

type ApiLog = {
  id: string;
  createdAt: string;
  pressure: number[];
  temperature: number[];
  action: string;
  reason?: string;
};

export default function HistoryByDate() {
  const [date, setDate] = useState<Date>(new Date()); // ✅ default วันนี้
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);

  // filters
  const [filterAction, setFilterAction] = useState("");
  const [filterReason, setFilterReason] = useState("");

  // sort
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // safe calc
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  const fetchByDateTime = useCallback(async () => {
    if (!date) return;
    setLoading(true);

    try {
      const base = format(date, "yyyy-MM-dd");
      const startISO = new Date(`${base}T${startTime}:00`).toISOString();
      const endISO = new Date(`${base}T${endTime}:59`).toISOString();

      const query = new URLSearchParams({
        start: startISO,
        end: endISO,
        limit: String(safeLimit),
        offset: String((page - 1) * safeLimit),
        action: filterAction,
        reason: filterReason,
        sortOrder,
      });

      const res = await fetch(`/api/plc/historybydatetime?${query.toString()}`);

      if (!res.ok) {
        console.error("❌ API error:", res.status);
        setLogs([]);
        setTotal(0);
        return;
      }

      const { data, totalCount } = await res.json();
      setLogs(data);
      setTotal(totalCount ?? 0);

      console.log("📊 fetch", {
        page,
        limit: safeLimit,
        totalCount,
        got: data.length,
      });
    } finally {
      setLoading(false);
    }
  }, [
    date,
    startTime,
    endTime,
    safeLimit,
    page,
    filterAction,
    filterReason,
    sortOrder,
  ]);

  // ✅ useEffect เดียวพอ
  useEffect(() => {
    if (date) {
      fetchByDateTime();
    }
  }, [page, sortOrder, fetchByDateTime, date]);

  useEffect(() => {
    if (date) {
      setPage(1); // จะไป trigger useEffect ข้างบนเอง
    }
  }, [filterAction, filterReason, limit, date, startTime, endTime]);

  const handleSearch = () => {
    setPage(1);
    fetchByDateTime();
  };

  return (
    <div className="p-4 rounded-lg border bg-white shadow space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
          ⏰ Logs by Date & Time Range
          {logs.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-600 rounded">
              Page {page}/{totalPages} • {total} records
            </span>
          )}
        </h3>
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          className="px-3 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700 shadow"
        >
          {sortOrder === "asc" ? "⬆ Asc" : "⬇ Desc"}
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker value={date} onChange={(d) => setDate(d ?? new Date())} />
        <Input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-28"
        />
        <span>ถึง</span>
        <Input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-28"
        />
        <input
          type="number"
          min={50}
          step={50}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-24 px-2 py-1 border rounded text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-sky-600 text-white px-4 py-2 rounded shadow hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? "⏳ Loading..." : "🔍 Search"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center text-sm">
        <div>
          Action:{" "}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="ml-1 text-xs text-black rounded border px-1 py-0.5"
          >
            <option value="">All</option>
            <option value="OK">OK</option>
            <option value="STOP">STOP</option>
          </select>
        </div>
        <div>
          Reason:{" "}
          <input
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            placeholder="ค้นหา reason"
            className="ml-1 px-2 py-0.5 text-xs text-black border rounded"
          />
        </div>
      </div>

      {/* Table */}
      <PlcLogTable logs={logs} loading={loading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            ⬅ Prev
          </button>
          <span className="text-sm">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>
      )}
    </div>
  );
}
