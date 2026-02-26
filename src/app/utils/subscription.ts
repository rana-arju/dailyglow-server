export type PlanLike = {
  planType?: string | null;
  interval?: string | null;
  name?: string | null;
};

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Handle month rollover (e.g., adding 1 month to Jan 31)
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
};

const addYears = (date: Date, years: number) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

export const computeEndDate = (plan: PlanLike, from: Date = new Date()): Date | null => {
  const planType = (plan?.planType || '').toUpperCase();
  const interval = (plan?.interval || '').toLowerCase();
  const name = (plan?.name || '').toLowerCase();

  // Lifetime plans never expire
  if (planType === 'LIFETIME' || interval === 'one_time' || name.includes('lifetime')) {
    return null;
  }

  // Yearly
  if (planType === 'YEARLY' || interval === 'year' || name.includes('yearly')) {
    return addYears(from, 1);
  }

  // Monthly (default recurring)
  if (planType === 'MONTHLY' || interval === 'month' || name.includes('monthly')) {
    return addMonths(from, 1);
  }

  // Fallback: 30 days
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
};
