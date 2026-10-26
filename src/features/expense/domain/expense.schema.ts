import { z } from 'zod';
import { amountSchema, timestampSchema } from '@/features/menu/domain/menu-item.schema';
import { argentinaDay } from '@/lib/format-date-time';
import { isValidDecimal } from '@/lib/utils';

const MAX_MONEY = 9_999_999.99;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isRealDate = (value: string): boolean => argentinaDay(`${value}T12:00:00-03:00`) === value;

const invoiceNumber = z.string('El número de factura es obligatorio').trim().min(1, 'El número de factura es obligatorio').max(30, 'El número de factura no puede superar los 30 caracteres');
const title = z.string('El título es obligatorio').trim().min(1, 'El título es obligatorio').max(100, 'El título no puede superar los 100 caracteres');
const amount = z
  .number('Ingresá un monto válido')
  .positive('El monto debe ser mayor a 0')
  .max(MAX_MONEY, 'El monto es demasiado alto')
  .refine((value) => isValidDecimal(value, 2), 'Máximo 2 decimales');
const invoiceDate = z.string('Elegí una fecha válida').regex(DATE_PATTERN, 'Elegí una fecha válida').refine(isRealDate, 'Elegí una fecha válida');
const version = z.number().int().min(1);

export const expenseCreateSchema = z.strictObject({ invoiceNumber, title, amount, invoiceDate });
export type ExpenseInput = z.infer<typeof expenseCreateSchema>;

export const expenseUpdateSchema = z.strictObject({ invoiceNumber, title, amount, invoiceDate, version });
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;

export const expenseDeleteSchema = z.strictObject({ id: z.uuid(), version });
export type ExpenseDeleteInput = z.infer<typeof expenseDeleteSchema>;

export const expenseRowSchema = z.object({
  id: z.uuid(),
  invoiceNumber: z.string(),
  title: z.string(),
  amount: amountSchema,
  invoiceDate: z.string(),
  version: z.number(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type ExpenseDef = z.output<typeof expenseRowSchema>;
