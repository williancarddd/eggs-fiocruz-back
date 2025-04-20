export function expirationFutureDate(minutes: number): Date {
  const expirationFutureDate = new Date();
  expirationFutureDate.setMinutes(expirationFutureDate.getMinutes() + minutes);
  return expirationFutureDate;
}
