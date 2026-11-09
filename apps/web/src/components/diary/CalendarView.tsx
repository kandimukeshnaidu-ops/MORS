'use client';

import { useState, useEffect } from 'react';
import { getCalendarMonth, type CalendarDaySummary } from '@/app/diary/actions';

interface CalendarViewProps {
  userId: string;
  onSelectDay: (dateStr: string) => void;
  selectedDate?: string | null;
}

export function CalendarView({ userId, onSelectDay, selectedDate }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [daySummaries, setDaySummaries] = useState<Record<number, CalendarDaySummary>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    getCalendarMonth(userId, year, month).then((res) => {
      if (!isCancelled) {
        const map: Record<number, CalendarDaySummary> = {};
        for (const item of res) {
          map[item.day] = item;
        }
        setDaySummaries(map);
        setLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [userId, year, month]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
  });

  // Calculate days in month and start weekday
  const totalDays = new Date(year, month, 0).getDate();
  const startDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-sm">
      {/* Month & Navigation Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
          {monthName} {year}
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-lg border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
            title="Previous month"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setYear(now.getFullYear());
              setMonth(now.getMonth() + 1);
            }}
            className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
            title="Next month"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-2 pt-4 text-center">
        {weekDays.map((d) => (
          <span key={d} className="text-xs font-semibold uppercase text-[var(--text-muted)]">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2 pt-2">
        {/* Leading blank cells */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
        ))}

        {/* Days of month */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const summary = daySummaries[dayNum];
          const hasLogs = summary && summary.count > 0;
          const formattedDateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isSelected = selectedDate === formattedDateStr;

          return (
            <button
              key={`day-${dayNum}`}
              type="button"
              onClick={() => onSelectDay(formattedDateStr)}
              className={`group relative aspect-square overflow-hidden rounded-xl border p-1.5 text-left transition-all select-none ${
                isSelected
                  ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/50'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-primary)]/60 hover:border-[var(--accent-primary)]/60'
              }`}
            >
              {/* Thumbnail background if available */}
              {summary?.thumbnailUrl && (
                <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={summary.thumbnailUrl}
                    alt={`Meals on day ${dayNum}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="relative z-10 flex h-full flex-col justify-between">
                <span
                  className={`text-xs font-semibold ${
                    hasLogs ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {dayNum}
                </span>

                {hasLogs && (
                  <span className="self-end rounded-full bg-[var(--accent-primary)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--bg-primary)]">
                    {summary.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="mt-3 text-center text-xs text-[var(--text-muted)] animate-pulse">
          Loading month records...
        </div>
      )}
    </div>
  );
}
