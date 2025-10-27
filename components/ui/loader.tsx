"use client";

export function Loader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 border-r-purple-600 absolute top-0 left-0"></div>
      </div>
      {text && (
        <p className="text-gray-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
}
