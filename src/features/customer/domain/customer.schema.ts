import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { customers } from '@/lib/db/schema';

export const customerName = z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo');
export const customerPhone = z
  .string()
  .trim()
  .max(30, 'Número de teléfono demasiado largo')
  .regex(/^[0-9\s+-]*$/, 'Formato de teléfono inválido (solo números, +, - y espacios)');
const emailFormat = z.email();
const email = z
  .string()
  .trim()
  .max(100, 'El correo electrónico es demasiado largo')
  .refine((value) => value === '' || emailFormat.safeParse(value).success, 'Formato de correo electrónico inválido');
const documentNumber = z.string().trim().max(20, 'Documento demasiado largo');
export const customerAddress = z.string().trim().max(150, 'Domicilio demasiado largo');

export const customerCreateSchema = z.strictObject({ name: customerName, phone: customerPhone, email, documentNumber, address: customerAddress.optional() });
export type CustomerInput = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  version: z.number().int().min(1),
});
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export const customerRowSchema = createSelectSchema(customers).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type CustomerDef = z.infer<typeof customerRowSchema>;
