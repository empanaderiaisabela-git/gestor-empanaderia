import { normalizeForSearch } from '@/lib/utils';

export const MAX_SUGGESTIONS = 5;
const MIN_TERM = 2;

type Searchable = { id: string; name: string; phone: string; isActive: boolean };

const matches = (customer: Searchable, term: string): boolean => normalizeForSearch(customer.name).includes(term) || normalizeForSearch(customer.phone).includes(term);

export function suggestCustomers<T extends Searchable>(customers: readonly T[], terms: readonly string[]): T[] {
  const needles = terms.map((term) => normalizeForSearch(term.trim())).filter((term) => term.length >= MIN_TERM);
  if (needles.length === 0) return [];
  return customers.filter((customer) => customer.isActive && needles.some((term) => matches(customer, term))).slice(0, MAX_SUGGESTIONS);
}
