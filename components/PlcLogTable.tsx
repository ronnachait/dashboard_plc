import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

export type PlcLog = {
  id: string;
  createdAt: string;
  pressure: number[];
  temperature: number[];
  action:
    | "ALARM_STILL_ACTIVE"
    | "STOP_BY_ALARM"
    | "START_BY_USER"
    | "STOP_BY_USER"
    | "RESET_ALARM"
    | string;
  reason?: string | null;
};

export function PlcLogTable({
  logs,
  loading,
}: {
  logs: PlcLog[];
  loading: boolean;
}) {
  // ✅ Map สี/label ให้ Action
  const getActionStyle = (action: string) => {
    switch (action) {
      case "ALARM_STILL_ACTIVE":
        return "bg-gradient-to-r from-yellow-200 to-yellow-300 text-yellow-800";
      case "STOP_BY_ALARM":
        return "bg-gradient-to-r from-red-500 to-red-700 text-white";
      case "START_BY_USER":
        return "bg-gradient-to-r from-green-400 to-green-600 text-white";
      case "STOP_BY_USER":
        return "bg-gradient-to-r from-pink-400 to-pink-600 text-white";
      case "RESET_ALARM":
        return "bg-gradient-to-r from-blue-400 to-blue-600 text-white";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <TooltipProvider>
      <div className="max-h-[500px] overflow-y-auto rounded-xl border border-slate-200 shadow-lg bg-white relative">
        <table className="w-full text-sm border-collapse">
          {/* Header */}
          <thead className="sticky top-0 bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md z-10">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Time</th>
              {Array.from({ length: 3 }, (_, i) => (
                <th key={i} className="px-4 py-3 text-center">
                  P{i + 1} <span className="text-[11px]">(bar)</span>
                </th>
              ))}
              {Array.from({ length: 9 }, (_, i) => (
                <th key={i} className="px-4 py-3 text-center">
                  T{i + 1} <span className="text-[11px]">(°C)</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center">Action</th>
              <th className="px-4 py-3 text-left">Reason</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={12}
                  className="text-center py-8 text-slate-500 italic"
                >
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="text-center py-8 text-slate-400 italic"
                >
                  ไม่มีข้อมูลในช่วงเวลาที่เลือก
                </td>
              </tr>
            ) : (
              logs.map((l, i) => {
                const reasons = l.reason
                  ? l.reason.split(",").map((r: string) => r.trim())
                  : [];

                return (
                  <tr
                    key={i}
                    className={`transition ${
                      i % 2 === 0 ? "bg-slate-50/60" : "bg-white"
                    } hover:bg-sky-50 hover:shadow-md`}
                  >
                    <td className="px-4 py-2 font-mono text-slate-700">
                      {l.id}
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-600">
                      {new Date(l.createdAt).toLocaleString("th-TH")}
                    </td>

                    {/* Pressure */}
                    {l.pressure.map((p: number, j: number) => {
                      const sensor = `P${j + 1}`;
                      const reasonMatch = reasons.find((r) =>
                        r.startsWith(sensor)
                      );
                      const isAlarm = Boolean(reasonMatch);
                      return (
                        <td key={j} className="px-4 py-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`inline-flex items-center justify-center w-12 h-6 rounded-full font-mono text-xs transition ${
                                  isAlarm
                                    ? "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md animate-pulse"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {typeof p === "number" ? p.toFixed(2) : "N/A"}
                              </span>
                            </TooltipTrigger>
                            {isAlarm && (
                              <TooltipContent>
                                <p className="text-xs text-red-600">
                                  {reasonMatch}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </td>
                      );
                    })}

                    {/* Temperature */}
                    {l.temperature.map((t: number, j: number) => {
                      const sensor = `T${j + 1}`;
                      const reasonMatch = reasons.find((r) =>
                        r.startsWith(sensor)
                      );
                      const isAlarm = Boolean(reasonMatch);
                      return (
                        <td key={j} className="px-4 py-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`inline-block px-2 py-1 rounded-full font-mono text-xs min-w-[55px] transition ${
                                  isAlarm
                                    ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md animate-pulse"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {typeof t === "number" ? t.toFixed(1) : "N/A"}
                              </span>
                            </TooltipTrigger>
                            {isAlarm && (
                              <TooltipContent>
                                <p className="text-xs text-orange-600">
                                  {reasonMatch}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </td>
                      );
                    })}

                    {/* Action */}
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide shadow-sm whitespace-nowrap ${getActionStyle(
                          l.action
                        )}`}
                      >
                        {l.action}
                      </span>
                    </td>

                    {/* Reason badges */}
                    <td className="px-4 py-2">
                      {reasons.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {reasons.map((r, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium shadow-sm ${
                                r.startsWith("T")
                                  ? "bg-gradient-to-r from-orange-200 to-orange-300 text-orange-800"
                                  : "bg-gradient-to-r from-red-200 to-red-300 text-red-800"
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}
