import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/menu-schema';
import { truncateAll } from '@/test/truncate-all';
import { drizzleMenuPhotoRepository } from './menu-photo.repository';

const repository = drizzleMenuPhotoRepository(db);

async function insertItem(name: string): Promise<string> {
  const [row] = await db.insert(menuItems).values({ group: 'pizzas', name, unitCost: '4000.00', price1: '11000.00' }).returning({ id: menuItems.id });
  return row.id;
}

describe('fotos de los gustos contra Postgres (T-12 CA-1)', () => {
  let muzza: string;
  let napo: string;

  beforeEach(async () => {
    await truncateAll();
    muzza = await insertItem('Muzza');
    napo = await insertItem('Napolitana');
    await repository.insert({ publicId: 'menu/muzza/1', url: 'https://fotos.test/1.webp', menuItemId: muzza });
    await repository.insert({ publicId: 'menu/napo/1', url: 'https://fotos.test/2.webp', menuItemId: napo });
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('lista las fotos de un gusto y las de varios gustos a la vez', async () => {
    expect((await repository.listOf(muzza)).map((photo) => photo.publicId)).toEqual(['menu/muzza/1']);
    expect((await repository.ofItems([muzza, napo])).map((photo) => photo.menuItemId).sort()).toEqual([muzza, napo].sort());
    expect(await repository.ofItems([])).toEqual([]);
  });

  it('encuentra y borra una foto, y avisa si ya no estaba', async () => {
    expect(await repository.find('menu/muzza/1')).toMatchObject({ menuItemId: muzza });
    expect([await repository.remove('menu/muzza/1'), await repository.remove('menu/muzza/1')]).toEqual([true, false]);
    expect(await repository.find('menu/muzza/1')).toBeNull();
  });

  it('borrar el gusto borra sus fotos', async () => {
    await db.delete(menuItems).where(eq(menuItems.id, napo));
    expect(await repository.listOf(napo)).toEqual([]);
  });
});
