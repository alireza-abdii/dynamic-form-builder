import * as React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import jalaali from 'jalaali-js';
import {
  parseJalaliString,
  formatJalaliString,
  getTodayJalali,
  type JalaliDateObject
} from '@fb/shared';
import { toPersianDigits } from '@fb/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

const PERSIAN_WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export interface JalaliCalendarProps {
  value?: string | undefined; // YYYY/MM/DD
  onChange?: ((dateString: string) => void) | undefined;
  minDate?: string | undefined; // 'today' or 'YYYY/MM/DD'
  maxDate?: string | undefined;
  className?: string | undefined;
}

export function JalaliCalendar({
  value,
  onChange,
  minDate,
  maxDate,
  className
}: JalaliCalendarProps) {
  const selectedDate = React.useMemo(() => (value ? parseJalaliString(value) : null), [value]);

  const today = React.useMemo(() => getTodayJalali(), []);

  const [viewYear, setViewYear] = React.useState<number>(
    selectedDate ? selectedDate.jy : today.jy
  );
  const [viewMonth, setViewMonth] = React.useState<number>(
    selectedDate ? selectedDate.jm : today.jm
  );

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Month days calculation
  const daysInMonth = jalaali.jalaaliMonthLength(viewYear, viewMonth);

  // First day of month day-of-week (0=Saturday, 1=Sunday, ... 6=Friday)
  const firstDayGregorian = jalaali.toGregorian(viewYear, viewMonth, 1);
  const gDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
  const gDay = gDate.getDay(); // 0 is Sunday, 6 is Saturday
  // Convert to Saturday=0: Sat(6)->0, Sun(0)->1, Mon(1)->2, ... Fri(5)->6
  const startDayOfWeek = (gDay + 1) % 7;

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.jy === viewYear &&
      selectedDate.jm === viewMonth &&
      selectedDate.jd === day
    );
  };

  const isToday = (day: number) => {
    return today.jy === viewYear && today.jm === viewMonth && today.jd === day;
  };

  const isDisabled = (day: number) => {
    const dStr = formatJalaliString(viewYear, viewMonth, day);
    if (minDate) {
      const minDStr = minDate === 'today' ? formatJalaliString(today.jy, today.jm, today.jd) : minDate;
      if (dStr < minDStr) return true;
    }
    if (maxDate) {
      const maxDStr = maxDate === 'today' ? formatJalaliString(today.jy, today.jm, today.jd) : maxDate;
      if (dStr > maxDStr) return true;
    }
    return false;
  };

  const handleSelectDay = (day: number) => {
    if (isDisabled(day)) return;
    const dateStr = formatJalaliString(viewYear, viewMonth, day);
    onChange?.(dateStr);
  };

  return (
    <div className={cn('p-3 select-none w-72', className)} dir="rtl">
      {/* Month & Year Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 min-h-8 min-w-8"
          onClick={nextMonth} // In RTL, right arrow goes forward
          aria-label="ماه بعد"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="text-sm font-bold text-foreground">
          {PERSIAN_MONTHS[viewMonth - 1]} {toPersianDigits(viewYear)}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 min-h-8 min-w-8"
          onClick={prevMonth} // In RTL, left arrow goes back
          aria-label="ماه قبل"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 pt-2 text-center text-xs font-semibold text-muted-foreground">
        {PERSIAN_WEEK_DAYS.map((wd, i) => (
          <div key={i} className="py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 pt-1 text-center text-sm">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9 w-9" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const selected = isSelected(day);
          const current = isToday(day);
          const disabled = isDisabled(day);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectDay(day)}
              className={cn(
                'h-9 w-9 rounded-xl flex items-center justify-center transition-colors text-sm font-medium',
                selected
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : current
                  ? 'border border-primary text-primary font-bold'
                  : 'hover:bg-accent hover:text-accent-foreground text-foreground',
                disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent text-muted-foreground'
              )}
            >
              {toPersianDigits(day)}
            </button>
          );
        })}
      </div>

      {/* Today Quick Action */}
      <div className="pt-3 border-t mt-3 flex justify-between items-center text-xs">
        <button
          type="button"
          onClick={() => {
            setViewYear(today.jy);
            setViewMonth(today.jm);
            handleSelectDay(today.jd);
          }}
          className="text-primary hover:underline font-medium"
        >
          امروز ({toPersianDigits(formatJalaliString(today.jy, today.jm, today.jd))})
        </button>
      </div>
    </div>
  );
}
