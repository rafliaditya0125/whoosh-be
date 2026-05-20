/**
 * Format a date or string to MySQL compatible DATETIME string (YYYY-MM-DD HH:MM:SS)
 */
export const formatMySQLDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    return date as string; // Return original if invalid
  }

  const pad = (num: number) => num.toString().padStart(2, '0');

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
