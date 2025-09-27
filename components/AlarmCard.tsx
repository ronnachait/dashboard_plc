import { BellRing, CheckCircle2 } from "lucide-react";

type AlarmProps = {
  active: boolean;
  reasons: string[];
};

export default function AlarmCard({ active, reasons }: AlarmProps) {
  return (
    <div
      className={`p-4 rounded-lg shadow-md border flex flex-col gap-2 transition-all duration-300 hover:shadow-lg ${
        active
          ? "bg-gradient-to-br from-red-50 to-red-100 border-red-400"
          : "bg-gradient-to-br from-green-50 to-green-100 border-green-400"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${
            active ? "bg-red-200" : "bg-green-200"
          }`}
        >
          {active ? (
            <BellRing className="h-6 w-6 text-red-600 animate-pulse-slow" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          )}
        </div>
        <div>
          <p className="text-xs text-gray-600">Alarm Status</p>
          <p
            className={`font-bold text-sm ${
              active ? "text-red-700" : "text-green-700"
            }`}
          >
            {active ? "Active Alarm" : "No Alarms"}
          </p>
        </div>
      </div>

      {/* Alarm details list */}
      {active && reasons.length > 0 && (
        <div className="mt-1 max-h-15 overflow-y-auto bg-red-50 rounded p-2 border border-red-200">
          <ul className="space-y-1 text-xs text-red-700 font-medium">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1">
                <span>🚨</span>
                <span className="truncate">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
