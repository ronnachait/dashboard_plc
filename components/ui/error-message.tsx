"use client";

import { AlertTriangle, XCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  title?: string;
  type?: "error" | "warning";
  onRetry?: () => void;
}

export function ErrorMessage({
  message,
  title = "เกิดข้อผิดพลาด",
  type = "error",
  onRetry,
}: ErrorMessageProps) {
  const isError = type === "error";

  return (
    <div
      className={`
        p-6 rounded-2xl border-2 shadow-lg animate-slide-in
        ${
          isError
            ? "bg-gradient-to-r from-red-50 to-red-100 border-red-300"
            : "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300"
        }
      `}
    >
      <div className="flex items-start gap-4">
        {isError ? (
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
        )}
        <div className="flex-1">
          <h3
            className={`font-bold text-lg mb-1 ${
              isError ? "text-red-800" : "text-yellow-800"
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-sm ${
              isError ? "text-red-700" : "text-yellow-700"
            }`}
          >
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className={`
                mt-4 px-4 py-2 rounded-lg font-medium text-white shadow-md hover:shadow-lg transition-all
                ${
                  isError
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }
              `}
            >
              ลองอีกครั้ง
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

