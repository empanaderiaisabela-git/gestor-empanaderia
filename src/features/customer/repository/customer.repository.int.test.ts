import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { DuplicateEntityError } from '@/lib/errors';
import { truncateAll } from '@/test/truncate-all';
import { customerRepository } from './customer.repository';

const ONLY_NAME = { name: 'Juana', phone: '', email: '', documentNumber: '' };

afterAll(async () => {
  await db.$client.end();
});

beforeEach(async () => {
  await truncateAll();
});

describe('clientes con sólo el nombre contra db-test (US-26)', () => {
  it('guarda dos clientes sin DNI, con el DNI en null', async () => {
    const first = await customerRepository.createCustomer(ONLY_NAME);
    const second = await customerRepository.createCustomer({ ...ONLY_NAME, name: 'Pedro' });

    expect([first.documentNumber, second.documentNumber]).toEqual([null, null]);
  });

  it('un DNI repetido sigue dando duplicado, aunque cambien los puntos', async () => {
    await customerRepository.createCustomer({ ...ONLY_NAME, documentNumber: '35123456' });

    await expect(customerRepository.createCustomer({ ...ONLY_NAME, name: 'Pedro', documentNumber: '35.123.456' })).rejects.toBeInstanceOf(DuplicateEntityError);
  });

  it('borrar el DNI al editar lo deja en null y no choca con otro cliente sin DNI', async () => {
    await customerRepository.createCustomer({ ...ONLY_NAME, name: 'Pedro' });
    const juana = await customerRepository.createCustomer({ ...ONLY_NAME, documentNumber: '35123456' });

    const updated = await customerRepository.updateCustomer(juana.id, { documentNumber: '', version: juana.version });

    expect(updated.documentNumber).toBeNull();
  });
});
