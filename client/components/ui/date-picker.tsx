"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, getYear, getMonth, startOfYear, endOfYear } from "date-fns";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  error?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  disabled,
  minDate,
  maxDate,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [showMonthScroller, setShowMonthScroller] = useState(false);
  const [showYearScroller, setShowYearScroller] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Center the selected month in the scroller when opened
  useEffect(() => {
    if (showMonthScroller) {
      const id = `month-${getMonth(currentMonth)}`;
      const el = document.getElementById(id);
      el?.scrollIntoView({ block: "center" });
    }
  }, [showMonthScroller, currentMonth]);

  // Center the selected year in the scroller when opened
  useEffect(() => {
    if (showYearScroller) {
      const id = `year-${getYear(currentMonth)}`;
      const el = document.getElementById(id);
      el?.scrollIntoView({ block: "center" });
    }
  }, [showYearScroller, currentMonth]);

  const handleDateSelect = (date: Date) => {
    if (!disabled || !disabled(date)) {
      onChange(date);
      setIsOpen(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const start = startOfWeek(startOfMonth(date));
    const end = endOfWeek(endOfMonth(date));
    return eachDayOfInterval({ start, end });
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isDateDisabled = (date: Date) => {
    // External disabled callback (e.g., no stock selected)
    if (disabled && disabled(date)) return true;

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const outsideRange = (minDate && date < minDate) || (maxDate && date > maxDate);

    // If date is outside historical range, allow weekdays but disable weekends
    if (outsideRange) {
      return isWeekend;
    }

    // Otherwise, enforce strict min/max if provided
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    return false;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          error && "border-red-500"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "PPP") : <span>Pick a date</span>}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-popover border rounded-md shadow-lg z-50 p-4 w-80">
          {/* Month/Year Header */}
          <div className="relative mb-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-accent rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowMonthScroller((s) => !s); setShowYearScroller(false); }}
                  className="text-sm font-semibold"
                >
                  {format(currentMonth, "MMMM")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowYearScroller((s) => !s); setShowMonthScroller(false); }}
                  className="text-sm font-semibold"
                >
                  {format(currentMonth, "yyyy")}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-accent rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Month Scroller */}
            {showMonthScroller && (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-popover border rounded-md shadow-md z-50 p-2 w-60">
                <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto hide-scrollbar">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthName = format(new Date(getYear(currentMonth), i, 1), "MMMM");
                    const isSelectedMonth = getMonth(currentMonth) === i;

                    return (
                      <button
                        key={i}
                        id={`month-${i}`}
                        type="button"
                        onClick={() => {
                          setCurrentMonth(new Date(getYear(currentMonth), i, 1));
                          setShowMonthScroller(false);
                        }}
                        className={cn(
                          "p-2 text-xs rounded hover:bg-accent transition-colors",
                          isSelectedMonth && "bg-primary text-primary-foreground"
                        )}
                      >
                        {monthName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Year Scroller */}
            {showYearScroller && (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-popover border rounded-md shadow-md z-50 p-2 w-28">
                <div className="max-h-40 overflow-y-auto hide-scrollbar">
                  {(() => {
                    const currentYear = getYear(currentMonth);
                    const minY = currentYear - 50;
                    const maxY = currentYear;
                    return Array.from({ length: maxY - minY + 1 }).map((_, idx) => {
                      const y = minY + idx;
                      const isSelectedYear = y === currentYear;
                      return (
                        <button
                          key={y}
                          id={`year-${y}`}
                          type="button"
                          onClick={() => {
                            setCurrentMonth(new Date(y, getMonth(currentMonth), 1));
                            setShowYearScroller(false);
                          }}
                          className={cn(
                            "w-full text-left p-2 text-sm rounded hover:bg-accent transition-colors",
                            isSelectedYear && "bg-primary text-primary-foreground"
                          )}
                        >
                          {y}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = value && isSameDay(day, value);
              const isDis = isDateDisabled(day);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isDis}
                  className={cn(
                    "p-2 text-xs rounded hover:bg-accent transition-colors",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    isDis && "opacity-50 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        /* Hide scrollbars for scroller containers */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
