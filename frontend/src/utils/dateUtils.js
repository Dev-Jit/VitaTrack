/** Format a Date as YYYY-MM-DD in the local timezone. */
export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's date as YYYY-MM-DD in the local timezone. */
export function todayLocal() {
  return formatLocalDate(new Date());
}

/** Format a Date for `<input type="datetime-local">` values. */
export function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/** Format a Date for backend LocalDateTime fields (no timezone suffix). */
export function formatLocalDateTimeForApi(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/** Parse YYYY-MM-DD as local midnight (avoids UTC shift from `new Date("YYYY-MM-DD")`). */
export function parseLocalDate(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysLocal(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysFromNowLocal(days) {
  return formatLocalDate(addDaysLocal(new Date(), days));
}

export function maxDateToday() {
  return todayLocal();
}

export function maxDateTimeNow() {
  return formatDateTimeLocal(new Date());
}

export function startOfTodayDateTimeLocal() {
  const now = new Date();
  return formatDateTimeLocal(
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0)
  );
}

function parseDateTimeLocal(value) {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function isFutureDateTimeLocal(value) {
  if (!value) return false;
  return parseDateTimeLocal(value).getTime() > Date.now();
}

export function isFutureLocalDate(isoDate) {
  if (!isoDate) return false;
  return isoDate > todayLocal();
}

/** Parse API timestamps without treating them as UTC. */
export function parseApiDateTime(value) {
  if (!value) return null;
  if (typeof value === "string" && !/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    const normalized = value.length === 16 ? `${value}:00` : value;
    return parseDateTimeLocal(normalized.slice(0, 19));
  }
  return new Date(value);
}
