// Study Check-in & Review Streak Engine
// Records continuous review days and generates interactive calendar data

export interface CheckinData {
  dates: string[];        // Array of 'YYYY-MM-DD'
  currentStreak: number;  // Current consecutive streak in days
  maxStreak: number;      // Record max streak
  totalDays: number;      // Lifetime checkin days
  isTodayCheckedIn: boolean;
}

const STORAGE_KEY_CHECKINS = 'zhiwei_study_checkins';

// Format Date to YYYY-MM-DD (local time)
export const formatDateKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Calculate consecutive streak looking backwards from today/yesterday
export const calculateStreak = (dateSet: Set<string>): { currentStreak: number; maxStreak: number } => {
  const todayStr = formatDateKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  let currentStreak = 0;
  // If user checked in today, count starts from today; else if yesterday, starts from yesterday; otherwise 0
  let checkDate = new Date();
  if (dateSet.has(todayStr)) {
    // start from today
  } else if (dateSet.has(yesterdayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // broken streak
    checkDate = null as any;
  }

  if (checkDate) {
    while (true) {
      const k = formatDateKey(checkDate);
      if (dateSet.has(k)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate historical max streak
  const sortedDates = Array.from(dateSet).sort();
  let maxStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dStr of sortedDates) {
    const cur = new Date(dStr + 'T00:00:00');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = cur.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxStreak) maxStreak = tempStreak;
    prevDate = cur;
  }

  if (currentStreak > maxStreak) maxStreak = currentStreak;

  return { currentStreak, maxStreak };
};

export const checkinService = {
  getCheckinData(): CheckinData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHECKINS);
      let dates: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(dates)) dates = [];

      const dateSet = new Set(dates);
      const todayStr = formatDateKey(new Date());
      const isTodayCheckedIn = dateSet.has(todayStr);
      const { currentStreak, maxStreak } = calculateStreak(dateSet);

      return {
        dates: Array.from(dateSet),
        currentStreak,
        maxStreak: Math.max(maxStreak, currentStreak),
        totalDays: dateSet.size,
        isTodayCheckedIn
      };
    } catch {
      return {
        dates: [],
        currentStreak: 0,
        maxStreak: 0,
        totalDays: 0,
        isTodayCheckedIn: false
      };
    }
  },

  checkInToday(): CheckinData {
    const data = this.getCheckinData();
    const todayStr = formatDateKey(new Date());
    const set = new Set(data.dates);
    set.add(todayStr);

    const newDates = Array.from(set);
    localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(newDates));

    const { currentStreak, maxStreak } = calculateStreak(set);
    return {
      dates: newDates,
      currentStreak,
      maxStreak: Math.max(maxStreak, currentStreak),
      totalDays: newDates.length,
      isTodayCheckedIn: true
    };
  },

  // Generates 35 or 42 calendar grid cells for a given month (Monday-first)
  getMonthCalendarGrid(year: number, month: number) {
    const data = this.getCheckinData();
    const dateSet = new Set(data.dates);
    const todayStr = formatDateKey(new Date());

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday-based day of week: 0 = Mon, 6 = Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isCheckedIn: boolean;
    }> = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const str = formatDateKey(prevDate);
      cells.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isCheckedIn: dateSet.has(str)
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const str = formatDateKey(curDate);
      cells.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: str === todayStr,
        isCheckedIn: dateSet.has(str)
      });
    }

    // Next month padding days to complete 35 or 42 cells
    const remaining = (cells.length <= 35 ? 35 : 42) - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const str = formatDateKey(nextDate);
      cells.push({
        dateStr: str,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: str === todayStr,
        isCheckedIn: dateSet.has(str)
      });
    }

    return cells;
  },

  /**
   * Get missed dates in the current month before today (sorted chronologically)
   */
  getMissedDatesThisMonth(): string[] {
    const data = this.getCheckinData();
    const dateSet = new Set(data.dates);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();

    const missed: string[] = [];
    for (let day = 1; day < todayDate; day++) {
      const d = new Date(year, month, day);
      const str = formatDateKey(d);
      if (!dateSet.has(str)) {
        missed.push(str);
      }
    }
    return missed;
  },

  /**
   * Make up a check-in for a specific missed date
   */
  makeUpCheckin(dateStr: string): CheckinData {
    const data = this.getCheckinData();
    const set = new Set(data.dates);
    set.add(dateStr);

    const newDates = Array.from(set).sort();
    localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(newDates));

    const { currentStreak, maxStreak } = calculateStreak(set);
    return {
      dates: newDates,
      currentStreak,
      maxStreak: Math.max(maxStreak, currentStreak),
      totalDays: newDates.length,
      isTodayCheckedIn: set.has(formatDateKey(new Date()))
    };
  },

  /**
   * Automatically make up the earliest missed date in the current month
   */
  autoMakeUpOldestMissedThisMonth(): { success: boolean; dateStr?: string; checkinData: CheckinData } {
    const missed = this.getMissedDatesThisMonth();
    if (missed.length === 0) {
      return { success: false, checkinData: this.getCheckinData() };
    }
    const targetDate = missed[0]; // earliest missed date
    const updated = this.makeUpCheckin(targetDate);
    return { success: true, dateStr: targetDate, checkinData: updated };
  }
};
