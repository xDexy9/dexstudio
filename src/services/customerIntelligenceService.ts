import { Job, CustomerIntelligence, RecurringIssue, RecurringPattern } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';
import { store } from '@/lib/mockStore';

export async function analyzeCustomerHistory(customerPhone: string): Promise<CustomerIntelligence | null> {
  const customerJobs = store.jobs
    .filter(j => j.customerPhone === customerPhone)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (customerJobs.length === 0) return null;

  const firstJob = customerJobs[customerJobs.length - 1];
  const lastJob = customerJobs[0];

  const categoryMap = new Map<string, { count: number; dates: string[] }>();
  customerJobs.forEach(job => {
    if (job.faultCategory) {
      job.faultCategory.split(',').forEach(cat => {
        const c = cat.trim();
        if (!categoryMap.has(c)) categoryMap.set(c, { count: 0, dates: [] });
        const entry = categoryMap.get(c)!;
        entry.count++;
        entry.dates.push(job.createdAt);
      });
    }
  });

  const recurringIssues: RecurringIssue[] = Array.from(categoryMap.entries())
    .filter(([, v]) => v.count > 1)
    .map(([category, { count, dates }]) => {
      const lastDate = dates[0];
      const daysAgo = differenceInDays(new Date(), parseISO(lastDate));
      const pattern: RecurringPattern = daysAgo < 60 ? 'monthly' : daysAgo < 120 ? 'quarterly' : 'biannual';
      return { category, occurrences: count, lastOccurrenceDate: lastDate, daysAgo, pattern };
    })
    .sort((a, b) => b.occurrences - a.occurrences);

  const totalDays = differenceInDays(parseISO(lastJob.createdAt), parseISO(firstJob.createdAt));
  const averageServiceInterval = customerJobs.length > 1 ? Math.round(totalDays / (customerJobs.length - 1)) : 90;

  const problemMap = new Map<string, number>();
  customerJobs.forEach(job => {
    const desc = job.problemDescription.slice(0, 50);
    problemMap.set(desc, (problemMap.get(desc) || 0) + 1);
  });
  const commonProblems = Array.from(problemMap.entries())
    .map(([description, frequency]) => ({ description, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  return {
    customerPhone,
    customerName: lastJob.customerName,
    totalJobs: customerJobs.length,
    recurringIssues,
    averageServiceInterval,
    lastServiceDate: lastJob.createdAt,
    commonProblems,
  };
}
