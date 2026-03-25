/**
 * Black-Scholes option pricing calculator for backend
 */

// Hardcoded VIX value (20% volatility)
const HARDCODED_VIX = 0.20;

/**
 * Calculates the Black-Scholes price for a European option.
 * @param S Current price of the underlying asset (spot price)
 * @param K Strike price
 * @param T Time to expiry in years (e.g., 0.25 for 3 months)
 * @param type 'ce' for Call Option, 'pe' for Put Option
 * @returns Option price
 */
export function blackScholes(
  S: number,
  K: number,
  T: number,
  type: 'ce' | 'pe' = 'ce'
): number {
  // Hardcoded risk-free rate (7% as 0.07)
  const riskFreeRate = 0.07;
  // Use hardcoded VIX volatility
  const volatility = HARDCODED_VIX;

  // Handle edge cases
  if (T <= 0 || S <= 0 || K <= 0) {
    return type === 'ce' ? Math.max(0, S - K) : Math.max(0, K - S);
  }

  const d1 = (Math.log(S / K) + (riskFreeRate + 0.5 * volatility * volatility) * T) / (volatility * Math.sqrt(T));
  const d2 = d1 - volatility * Math.sqrt(T);

  const N = (x: number) => 0.5 * (1 + erf(x / Math.sqrt(2)));

  function erf(x: number): number {
    // Approximation of the error function
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  if (type === 'ce') {
    const callPrice = S * N(d1) - K * Math.exp(-riskFreeRate * T) * N(d2);
    return Math.max(0, callPrice);
  } else {
    const putPrice = K * Math.exp(-riskFreeRate * T) * N(-d2) - S * N(-d1);
    return Math.max(0, putPrice);
  }
}

/**
 * Returns the number of days between the expiry date and the current date.
 * @param expiryDate - The expiry date as a string in DD-MM-YYYY format
 * @returns Number of days (can be negative if expiry is in the past)
 */
export function getDaysToExpiry(expiryDate: string): number {
  const now = new Date();
  
  // Parse DD-MM-YYYY format
  const [day, month, year] = expiryDate.split('-').map(Number);
  const expiry = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
  
  // Calculate difference in milliseconds and convert to days (decimal)
  const diffMs = (expiry.getTime() - now.getTime());
  const days = diffMs / (1000 * 60 * 60 * 24);
  
  // Return minimum time to avoid zero division
  return days <= 0 ? 0.000000011574074074 : days;
}

/**
 * Convert days to years for Black-Scholes calculation
 * @param days Number of days
 * @returns Time in years
 */
export function daysToYears(days: number): number {
  return days / 365.25;
}
