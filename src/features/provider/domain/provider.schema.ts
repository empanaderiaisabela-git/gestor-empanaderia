import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { providers } from '@/lib/db/schema';

const name = z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'Nombre demasiado largo');
const phone = z.string().trim().min(1, 'El teléfono es obligatorio').max(30, 'Número de teléfono demasiado largo');
const email = z.email('Formato de correo electrónico inválido').trim().min(1, 'El correo es obligatorio').max(100, 'El correo electrónico es demasiado largo');
const version = z.number().int().min(1);

export const providerCreateSchema = z.strictObject({ name, phone, email });
export type ProviderInput = z.infer<typeof providerCreateSchema>;

export const providerUpdateSchema = providerCreateSchema.partial().extend({ version });
export type ProviderUpdateInput = z.infer<typeof providerUpdateSchema>;

export const providerToggleSchema = z.strictObject({ id: z.uuid(), isActive: z.boolean(), version });
export type ProviderToggleInput = z.infer<typeof providerToggleSchema>;

export const providerDeleteSchema = z.strictObject({ id: z.uuid(), version });
export type ProviderDeleteInput = z.infer<typeof providerDeleteSchema>;

export const providerRowSchema = createSelectSchema(providers).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});
export type ProviderDef = z.infer<typeof providerRowSchema>;
