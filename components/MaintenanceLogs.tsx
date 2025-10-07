import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Log = {
  id: string;
  doneAtHour: number;
  doneAt: string;
  doneBy?: string;
  remarks?: string;
  photoUrl?: string;
};

export function MaintenanceLogModal({
  planId,
  open,
  onClose,
}: {
  planId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetch(`/api/maintenance/${planId}/logs`)
        .then((res) => res.json())
        .then((data) => setLogs(data))
        .catch((err) => console.error("❌ error loading logs:", err))
        .finally(() => setLoading(false));
    }
  }, [planId, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>📜 ประวัติการบำรุงรักษา</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-gray-500 py-6">กำลังโหลด...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-400 py-6">
            ยังไม่มีประวัติการบำรุง
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-gray-50 border rounded-lg shadow-sm hover:bg-gray-100"
              >
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{log.doneAtHour} ชม.</Badge>
                  <p className="text-xs text-gray-500">
                    {new Date(log.doneAt).toLocaleString("th-TH", {
                      hour12: false,
                    })}
                  </p>
                </div>
                {log.doneBy && (
                  <p className="text-sm text-gray-600 mt-1">
                    ผู้ทำ: <span className="font-medium">{log.doneBy}</span>
                  </p>
                )}
                {log.remarks && (
                  <p className="text-sm text-gray-500 mt-1">💬 {log.remarks}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
