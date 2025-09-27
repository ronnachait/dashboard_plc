"use client";

type AlarmBannerProps = {
  alarms: string[];
};

export default function AlarmBanner({ alarms }: AlarmBannerProps) {
  if (!alarms || alarms.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 shadow-lg flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚨</span>
          <p className="font-semibold">Alarm Active: {alarms.join(", ")}</p>
        </div>
      </div>
    </div>
  );
}
