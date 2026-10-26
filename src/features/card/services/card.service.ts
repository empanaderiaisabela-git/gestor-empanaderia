import { AppError } from '@/lib/errors';
import { describePlans } from '@/features/card/domain/card-describe';
import type { CardDeleteInput, CardInput, CardToggleInput, CardUpdateInput } from '@/features/card/domain/card.schema';
import type { Card } from '@/features/card/repository/card.repository';
import { type CardScope, type CardUnitOfWork, drizzleCardUnitOfWork } from '@/features/card/repository/card-unit-of-work';

type Caller = { id: string };

export type CardService = {
  list(): Promise<Card[]>;
  create(caller: Caller, input: CardInput): Promise<Card>;
  update(caller: Caller, id: string, input: CardUpdateInput): Promise<Card>;
  setActive(caller: Caller, input: CardToggleInput): Promise<Card>;
  remove(caller: Caller, input: CardDeleteInput): Promise<void>;
};

const orStale = (card: Card | null): Card => {
  if (!card) throw new AppError('STALE_VERSION');
  return card;
};

const summary = (card: Card): Record<string, unknown> => ({ name: card.name, plans: describePlans(card.plans.map(({ installments, surchargePct }) => ({ installments, surchargePct: Number(surchargePct) }))) });

async function assertFreeName({ cards }: CardScope, name: string, ownId: string | null): Promise<void> {
  const sameName = await cards.findByName(name);
  if (sameName && sameName.id !== ownId) throw new AppError('DUPLICATE');
}

async function createCard(scope: CardScope, caller: Caller, input: CardInput): Promise<Card> {
  await assertFreeName(scope, input.name, null);
  const card = await scope.cards.insert(input);
  await scope.audit({ userId: caller.id, action: 'CREAR', entityId: card.id, detail: summary(card) });
  return card;
}

async function updateCard(scope: CardScope, caller: Caller, { id, input }: { id: string; input: CardUpdateInput }): Promise<Card> {
  const { version, ...changes } = input;
  await assertFreeName(scope, changes.name, id);
  const card = orStale(await scope.cards.update({ id, version }, changes));
  await scope.audit({ userId: caller.id, action: 'ACTUALIZAR', entityId: id, detail: summary(card) });
  return card;
}

async function setCardActive({ cards, audit }: CardScope, caller: Caller, { id, isActive, version }: CardToggleInput): Promise<Card> {
  const card = orStale(await cards.update({ id, version }, { isActive }));
  await audit({ userId: caller.id, action: isActive ? 'ACTUALIZAR' : 'ELIMINAR', entityId: id, detail: { name: card.name, action: isActive ? 'Reactivada' : 'Desactivada' } });
  return card;
}

async function removeCard({ cards, audit }: CardScope, caller: Caller, ref: CardDeleteInput): Promise<void> {
  const card = orStale(await cards.findById(ref.id));
  if (!(await cards.remove(ref))) throw new AppError('STALE_VERSION');
  await audit({ userId: caller.id, action: 'ELIMINAR', entityId: ref.id, detail: { ...summary(card), note: 'Eliminación permanente' } });
}

export function createCardService({ unitOfWork }: { unitOfWork: CardUnitOfWork }): CardService {
  return {
    list: () => unitOfWork.read.findAll(),
    create: (caller, input) => unitOfWork.run((scope) => createCard(scope, caller, input)),
    update: (caller, id, input) => unitOfWork.run((scope) => updateCard(scope, caller, { id, input })),
    setActive: (caller, input) => unitOfWork.run((scope) => setCardActive(scope, caller, input)),
    remove: (caller, input) => unitOfWork.run((scope) => removeCard(scope, caller, input)),
  };
}

export const cardService = createCardService({ unitOfWork: drizzleCardUnitOfWork });
