# Plan: US-51 — Litros como texto libre y nombre en "Editar producto"

- **Autor**: Claude Code con Ignacio Tomas · **Fecha**: 2026-10-31 · **Estado**: hecho y en `develop` (2026-10-31); Supabase en la 0027
- **Nivel de tests**: 3 (schema, migración y cambio que cruza capas)
- **Rama**: `hotfix/6.1-litros-como-texto` desde `develop` (hotfix del Sprint 6.1, pedido del dev)

## Objetivo

1. En Alta de productos, "Editar producto" muestra arriba del formulario el nombre completo de lo que se edita.
2. En Coca-Cola y Quilmes, "Litros" pasa a ser **texto libre**: "500CC", "1 L", "1.5L". La **familia** (los sabores
   que comparten costo, precio y proveedor) es **grupo + bebida + ese texto, con coincidencia exacta**. No se pasa a
   minúsculas ni se normaliza: "1.5L" y "1.5 L" son familias distintas, y "Aquarius" y "aquarius" también.

## Decisiones

- **D-1 · Columna nueva, no cambio de tipo**: `menu_items.liters` (`numeric`) queda. Se suma `drink_size
  varchar(10)` y desde ahora se escribe ésa. Las bebidas de US-49 con `liters` numérico se siguen leyendo como
  `"<n> L"` hasta que se editan. Cambiar el tipo de `liters` sería destructivo.
- **D-2 · El check se relaja (cambia la regla D-5, aprobado por el dev el 2026-10-31)**: `menu_items_drink_check`
  hoy exige `liters > 0`. La migración lo borra y lo vuelve a crear con una condición más amplia. No borra ni cambia
  datos, y las filas de hoy la cumplen. `additive-migrations.test.ts` acepta `DROP CONSTRAINT "x"` sólo si el mismo
  `.sql` hace `ADD CONSTRAINT "x"`.
- **D-3 · Largos**: Bebida hasta 25, Litros de 1 a 8 y Sabor hasta 25. Con dos espacios, el nombre armado da a lo
  sumo 60, el tope de `name`.
- **D-4 · Bebida exacta**: la comparación de bebida también es exacta (deja de usar `ilike` y `toLocaleLowerCase`).

## Cambios por archivo

### 1. Título en "Editar producto"

`src/features/menu/ui/menu-item-form-modal.tsx` (el `title` está en la línea 38). Primera línea dentro del
`<ResponsiveModal>`, antes de `<ErrorAlert>`:

```tsx
{editingItem && <p className='text-lg font-bold text-zinc-900 dark:text-zinc-50'>{editingItem.name}</p>}
```

Test: en `src/features/menu/ui/menu-panel.test.tsx` o en un test nuevo del modal, editar un producto muestra su
nombre en el modal.

### 2. Schema y migración 0027

`src/lib/db/menu-schema.ts`:
- Después de `liters: numeric('liters', …)` (línea 27):
  ```ts
  drinkSize: varchar('drink_size', { length: 10 }),
  ```
- Reemplazar el check `menu_items_drink_check` (líneas 37 a 41) por:
  ```ts
  check(
    'menu_items_drink_check',
    sql`(${table.drinkName} is null and ${table.liters} is null and ${table.drinkSize} is null and ${table.flavor} is null)
      or (${table.group} in ('coca_cola', 'pepsi') and ${table.drinkName} is not null and (${table.liters} > 0 or ${table.drinkSize} is not null))`
  ),
  ```
- `npm run db:generate -- --name litros-como-texto` genera `0027_litros-como-texto.sql`, con un `ADD COLUMN` más
  `DROP CONSTRAINT` y `ADD CONSTRAINT` del check. **Leelo antes de commitear**: no puede tener otra cosa.

`src/lib/db/additive-migrations.test.ts`:
- Antes de comparar con `FORBIDDEN`, sacar del texto los pares que se recrean:
  ```ts
  const recreated = (sql: string): string =>
    sql.replace(/DROP CONSTRAINT "([^"]+)"/g, (statement, name) => (sql.includes(`ADD CONSTRAINT "${name}"`) ? '' : statement));
  ```
  y en el `it.each` usar `expect(recreated(readFileSync(...))).not.toMatch(FORBIDDEN)`.
- Sumar un caso al primer `it`: un `DROP CONSTRAINT "a"` sin su `ADD CONSTRAINT "a"` sigue prohibido.

Test nuevo `src/lib/db/litros-como-texto.migration.int.test.ts`, copiando `bebidas-por-litros.migration.int.test.ts`:
- `UNDO`: `DROP CONSTRAINT "menu_items_drink_check"`, `DROP COLUMN "drink_size"` y el check viejo vuelto a
  agregar (el de la 0026).
- Insertar una bebida de US-49 (`drink_name 'Aquarius'`, `liters 1.5`) y una comida, correr la migración y comprobar
  que siguen iguales.
- Comprobar que el check acepta `drink_size '500CC'` con `liters` nulo y rechaza `drink_size` en una empanada.

### 3. Domain — `src/features/menu/domain/drink.ts`

Reemplazar las partes de litros:

```ts
export type DrinkFields = { drinkName: string; size: string; flavor: string | null };
type FamilyRow = { group: MenuGroup; drinkName: string | null; drinkSize: string | null; liters: number | string | null };

export const size = z.string('Ingresá los litros').trim().min(1, 'Ingresá los litros').max(8, 'Los litros no pueden superar los 8 caracteres');

export const sizeOf = ({ drinkSize, liters }: Pick<FamilyRow, 'drinkSize' | 'liters'>): string | null =>
  drinkSize ?? (liters === null ? null : `${Number(liters)} L`);

export function drinkNameOf({ drinkName: name, size: amount, flavor: taste }: DrinkFields): string {
  return [name, amount, taste].filter(Boolean).join(' ');
}

export function sameFamily(a: FamilyRow, b: FamilyRow): boolean {
  const [sizeA, sizeB] = [sizeOf(a), sizeOf(b)];
  return a.drinkName !== null && sizeA !== null && a.group === b.group && a.drinkName === b.drinkName && sizeA === sizeB;
}
```

- Borrar `liters` (el schema de Zod), `thousandths`, `litersText` y `parseLiters`.
- `familySourceOf` cambia el tipo genérico a `T extends FamilyRow & { price1: number | null }`.
- `src/features/menu/domain/drink.test.ts`: reescribir los casos de litros. Nombre con "500CC" → "Aquarius 500CC
  Manzana"; `size` vacío y de 9 caracteres con el mensaje exacto; "1.5L" y "1.5 L" no son la misma familia; una
  fila de US-49 con `liters: '1.500'` da `sizeOf` "1.5 L". El fuzz del nombre ≤ 60 usa `size` de 1 a 8.

### 4. Schemas — `src/features/menu/domain/menu-item.schema.ts`

- Línea 2: `import { DRINK_GROUPS, drinkName, flavor, size } from './drink';`
- Línea 9: `const drinkFields = { drinkName, size, flavor: flavor.optional() };`
- En `menuItemRowSchema`, debajo de `liters` (línea 48): `drinkSize: z.string().nullable(),`
- `menu-item.schema.test.ts`: los objetos de fila suman `drinkSize: null`.

### 5. Repositorio de menú — `src/features/menu/repository/menu-item.repository.ts`

- Línea 12: `export type FamilyKey = Pick<DrinkFields, 'drinkName' | 'size'>;`
- Línea 35 (`drinkColumns`):
  ```ts
  export const drinkColumns = (drink: DrinkFields | undefined): Partial<MenuItem> =>
    drink ? { drinkName: drink.drinkName, drinkSize: drink.size, liters: null, flavor: drink.flavor } : {};
  ```
  (`liters: null` limpia el número viejo cuando se edita una bebida de US-49).
- Líneas 49 y 50 (`findFamily`): filtrar en SQL por grupo y bebida exacta, y por tamaño en JS:
  ```ts
  findFamily: async (group, { drinkName, size }) =>
    (await executor.select().from(menuItems).where(and(eq(menuItems.group, group), eq(menuItems.drinkName, drinkName))).orderBy(asc(menuItems.id)))
      .filter((row) => sizeOf(row) === size),
  ```
  (importar `sizeOf` de `drink.ts`; `ilike` y `escapeLike` dejan de usarse acá, pero `escapeLike` sigue en
  `findByName`).

`src/features/menu/testing/fake-menu-unit-of-work.ts`:
- `base` (línea 14) suma `drinkSize: null`.
- Línea 28: `findFamily: async (group, key) => state.rows.filter((row) => row.group === group && row.drinkName === key.drinkName && sizeOf(row) === key.size),`

### 6. Service de menú — `src/features/menu/services/menu-item-drink.ts`

- Línea 13: `const drink = { drinkName: input.drinkName, size: input.size, flavor: input.flavor ?? null };`
- `menu-item-drink.test.ts` y `src/features/menu/actions/drink-actions.contract.test.ts`: cambiar `liters: 1.5`
  por `size: '1.5L'`. El nombre esperado pasa a "Aquarius 1.5L Manzana", y la fila esperada a `drinkSize: '1.5L',
  liters: null`. El caso "toma el precio de la familia sin importar mayúsculas" se invierte: con "aquarius" ya **no**
  es la misma familia.

### 7. Formulario de Alta

`src/features/menu/ui/menu-item-form.ts`:
- Línea 1: `import { isDrinkGroup, sizeOf } from '@/features/menu/domain/drink';`
- Líneas 5 y 8: renombrar `liters` a `size` en `FORM_KEYS` y en `MenuItemFormValues` (`size: string`).
- `legacyDrink` (líneas 16 a 22): ya no convierte, toma el texto tal cual:
  ```ts
  const [, drink, amount, unit, flavor] = match;
  return { drinkName: drink.trim(), size: `${amount} ${unit}`, flavor: flavor.trim() };
  ```
  ("Aquarius 1,5 L Manzana" → `size` "1,5 L"; "Coca-Cola 500 ml" → "500 ml").
- Línea 27: `size: ''` en lugar de `liters: ''`.
- Línea 29: `size: sizeOf(item) ?? ''` en lugar de `liters: …`.
- Línea 42 (`drinkOf`): `({ drinkName: values.drinkName, size: values.size, flavor: values.flavor })`.

`src/features/menu/ui/menu-item-fields.tsx` (líneas 26 y 27):
```tsx
<FormField label='Litros' error={errors.size}>
  <input value={values.size} onChange={(event) => onChange({ ...values, size: event.target.value })} placeholder='Ej: 1.5L o 500CC' className={inputClass(Boolean(errors.size))} />
```
(sin `inputMode='decimal'`, porque ahora lleva letras).

`menu-item-form.test.ts`: `NO_DRINK` usa `size: ''`. El caso de bebida manda `size: '1.5L'` y espera `size:
'1.5L'`. Los casos de BUG-29 esperan `size: '1,5 L'`, `'500 ml'` y `'1,5L'`.

### 8. Stock

`src/features/stock/repository/stock.repository.ts`:
- Línea 19: `export type FamilyRef = Pick<StockItem, 'group' | 'drinkName' | 'drinkSize' | 'liters'>;`
- Líneas 45 a 49 (`lockFamily`):
  ```ts
  lockFamily: async (ref) => {
    const size = sizeOf(ref);
    if (ref.drinkName === null || size === null) return [];
    const rows = await executor.select().from(menuItems)
      .where(and(eq(menuItems.group, ref.group), eq(menuItems.drinkName, ref.drinkName), eq(menuItems.isBase, false)))
      .orderBy(asc(menuItems.id)).for('update');
    return rows.filter((row) => sizeOf(row) === size);
  },
  ```

`src/features/stock/testing/fake-stock-unit-of-work.ts`:
- Línea 18: `familyKeyOf` deja de convertir `liters`. `familyIn` pasa a ser
  `state.items.filter((item) => !item.isBase && sameFamily(ref, item))` (`sameFamily` ya acepta filas).

`src/features/stock/testing/stock-item.ts`: sumar `drinkSize: null,` debajo de `liters: null,`.

`src/features/stock/ui/stock-drink-selects.tsx`:
- Línea 3: importar `sizeOf` en lugar de `litersText`.
- Línea 26: `useState(current ? (sizeOf(current) ?? '') : '')`.
- Líneas 28 y 36: comparar con `sizeOf(item) === liters` en lugar de `String(item.liters) === liters`.
- Línea 51: opciones con `uniqueBy(ofDrink, (item) => sizeOf(item) ?? '')`, sin `sort` numérico (se ordenan como
  texto o como vienen), `value={sizeOf(item) ?? ''}` y la etiqueta `{sizeOf(item)}`.
- `drinkKeyOf` (línea 9): pasa a comparar exacto. Saca `toLocaleLowerCase('es')`.

`src/features/stock/domain/stock-increase.ts`:
- Línea 2: importar `sizeOf` en lugar de `litersText`.
- Líneas 37 y 38: `const named = row.ids.length > 1 && first?.drinkName && first && sizeOf(first);` y la etiqueta
  `` `${first.drinkName} ${sizeOf(first)} (${row.ids.length} sabores)` ``.

`src/features/stock/ui/use-family-provider.ts` y `stock-pricing-modal.tsx`: no cambian, porque `sameFamily` acepta
las filas tal cual.

### 9. Fixtures de tests

Todo objeto `MenuItemDef` o `StockItem` armado a mano suma `drinkSize: null`. Con un reemplazo en los archivos que
tienen `drinkName: null, liters: null, flavor: null`:
`drinkName: null, liters: null, flavor: null` → `drinkName: null, liters: null, drinkSize: null, flavor: null`.
Son, entre otros: `menu-item-columns.test.tsx`, `use-menu-panel.test.tsx`, `board-fixtures.ts` y los tests de
`src/features/stock/ui/*.test.tsx`. `npm run typecheck` marca los que falten.

Los fixtures de bebidas con `liters: 1.5` (`stock-drink.test.tsx`, `stock-increase.test.ts`,
`stock-increase-modal.test.tsx`, `stock-family.test.ts` y `stock-family.int.test.ts`) pasan a `drinkSize: '1.5L',
liters: null`. Las etiquetas esperadas cambian a "1.5L". En `stock-family.test.ts`, la familia de 1 L usa
`drinkSize: '1L'`.

### 10. E2E

- `tests/stock-precios.spec.ts`: `fill('1,5')` → `fill('1.5L')`; `selectOption({ label: '1.5 L' })` → `'1.5L'`; los
  textos esperados `${bebida} 1.5 L ${sabor}` → `${bebida} 1.5L ${sabor}`.
- `tests/aumento.spec.ts`: `fill('1')` → `fill('500CC')`, `selectOption({ label: '1 L' })` → `'500CC'` y
  `${bebida} 1 L queda con 3` → `${bebida} 500CC queda con 3`.

### 11. Docs y backlog

- `BACKLOG.md`: US-51 con CA-1 (título), CA-2 (migración 0027 y check relajado), CA-3 (litros como texto y familia
  exacta) y CA-4 (tests y E2E).
- `docs/features/menu/README.md`: la regla de bebidas dice texto libre y familia exacta; en Datos, `drink_size` y el
  check nuevo.
- `docs/features/stock/README.md`: "Bebida → Litros → Sabor" con los litros como texto.
- `docs/plans/sprint-6.md`: anotar que D-5 admite recrear un check en la misma migración (D-2 de este plan).

## Verificación

1. `npm run db:generate -- --name litros-como-texto` y leer el `.sql`.
2. `npm run db:migrate` (base local → 28 migraciones).
3. `npm run lint && npm run typecheck`.
4. `docker compose up -d --wait db-test` y `npm run verify` completo.
5. `npm run test:e2e -- tests/stock-precios.spec.ts tests/aumento.spec.ts tests/stock.spec.ts`.
6. A mano: en Alta, una bebida con "500CC" y otra con "500 CC" quedan en familias distintas. "Editar" muestra el
   nombre arriba. Una bebida de US-49 (litros numéricos) se edita y se guarda con su texto.
7. Push a `develop`. Supabase a **28** antes de `main`:
   `$env:APP_ENV="production"; npm run db:migrate; Remove-Item Env:APP_ENV` y `select count(*) from
   drizzle.__drizzle_migrations;` tiene que dar 28.
