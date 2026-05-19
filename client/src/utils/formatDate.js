// client/src/utils/formatDate.js
import { formatDistanceToNow, format, isThisYear } from "date-fns";

// "2 hours ago" for recent, "Jan 12" for older
export const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

// "Jan 12, 2024" or "Jan 12" if current year
export const formatDate = (date) => {
  const d = new Date(date);
  return isThisYear(d) ? format(d, "MMM d") : format(d, "MMM d, yyyy");
};

// "Jan 12, 2024 at 3:30 PM"
export const formatDateTime = (date) =>
  format(new Date(date), "MMM d, yyyy 'at' h:mm a");

// "Monday, January 12, 2024"
export const formatEventDate = (date) =>
  format(new Date(date), "EEEE, MMMM d, yyyy");