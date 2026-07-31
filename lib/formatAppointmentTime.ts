export function formatAppointmentTime(time: string) {
  const [hoursValue, minutesValue] = time.split(":").map(Number);

  if (
    !Number.isInteger(hoursValue) ||
    !Number.isInteger(minutesValue) ||
    hoursValue < 0 ||
    hoursValue > 23 ||
    minutesValue < 0 ||
    minutesValue > 59
  ) {
    return time;
  }

  const period = hoursValue >= 12 ? "p.m." : "a.m.";
  const hours = hoursValue % 12 || 12;

  return `${hours}:${String(minutesValue).padStart(2, "0")} ${period}`;
}
