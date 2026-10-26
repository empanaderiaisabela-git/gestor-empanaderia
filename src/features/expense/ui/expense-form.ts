import { type ExpenseDef, type ExpenseInput, expenseCreateSchema, expenseUpdateSchema, type ExpenseUpdateInput } from '@/features/expense/domain/expense.schema';

const FIELDS = ['invoiceNumber', 'title', 'amount', 'invoiceDate'] as const;
type Field = (typeof FIELDS)[number];

export type ExpenseFormValues = Record<Field, string>;
export type ExpenseFormErrors = Partial<Record<Field, string>>;
export type FormResult<T> = { ok: true; input: T } | { ok: false; errors: ExpenseFormErrors };
type Issue = { path: PropertyKey[]; message: string };

const toNumber = (text: string): number => (text.trim() === '' ? Number.NaN : Number(text.replace(',', '.')));
const isField = (key: PropertyKey | undefined): key is Field => FIELDS.some((field) => field === key);

export function initialValues(expense: ExpenseDef | null, today: string): ExpenseFormValues {
  if (!expense) return { invoiceNumber: '', title: '', amount: '', invoiceDate: today };
  return { invoiceNumber: expense.invoiceNumber, title: expense.title, amount: String(expense.amount), invoiceDate: expense.invoiceDate };
}

export function formatInvoiceDate(invoiceDate: string): string {
  const [year, month, day] = invoiceDate.split('-');
  return `${day}/${month}/${year}`;
}

function errorsOf(issues: readonly Issue[]): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};
  for (const { path, message } of issues) {
    const key = path[0];
    if (isField(key) && !errors[key]) errors[key] = message;
  }
  return errors;
}

const payloadOf = (values: ExpenseFormValues): Record<string, unknown> => ({ ...values, amount: toNumber(values.amount) });

export function parseCreate(values: ExpenseFormValues): FormResult<ExpenseInput> {
  const result = expenseCreateSchema.safeParse(payloadOf(values));
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}

export function parseUpdate(values: ExpenseFormValues, version: number): FormResult<ExpenseUpdateInput> {
  const result = expenseUpdateSchema.safeParse({ ...payloadOf(values), version });
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: errorsOf(result.error.issues) };
}
