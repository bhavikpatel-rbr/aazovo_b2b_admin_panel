export function formatCustomDateTime(dateInput, fallback = 'N/A') {
  // 1. Handle empty or null input gracefully
  if (!dateInput) {
    return fallback;
  }

  const date = new Date(dateInput);

  // 2. Check for invalid dates (e.g., from an unparseable string)
  if (isNaN(date.getTime())) {
    return fallback;
  }

  // 3. Get the individual parts of the date
  const day = date.getDate(); // e.g., 29
  const month = date.toLocaleString('en-US', { month: 'short' }); // e.g., "Jun"
  const year = date.getFullYear(); // e.g., 2025

  // 4. Get the time part and ensure AM/PM is uppercase
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',      // e.g., "3"
    minute: '2-digit',    // e.g., "23"
    hour12: true,         // Use 12-hour clock
  }).toUpperCase(); // Converts "pm" to "PM"

  // 5. Assemble the final string
  return `${day} ${month} ${year}, ${time}`;
}