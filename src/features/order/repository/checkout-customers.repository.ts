import { and, eq } from 'drizzle-orm';
import { customers } from '@/lib/db/schema';
import type { DbTransaction } from '@/lib/db/transaction';

export type NewCustomer = { name: string; phone: string; address: string };

export type CheckoutCustomers = {
  isActive(customerId: string): Promise<boolean>;
  insert(customer: NewCustomer): Promise<string>;
};

export function drizzleCheckoutCustomers(executor: DbTransaction): CheckoutCustomers {
  return {
    isActive: async (customerId) => {
      const rows = await executor
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.id, customerId), eq(customers.isActive, true)))
        .for('share');
      return rows.length > 0;
    },
    insert: async (customer) => {
      const [row] = await executor.insert(customers).values(customer).returning({ id: customers.id });
      return row.id;
    },
  };
}
