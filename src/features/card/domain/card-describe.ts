type Plan = { installments: number; surchargePct: number };

const percent = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

export function describePlan({ installments, surchargePct }: Plan): string {
  const label = installments === 1 ? '1 cuota' : `${installments} cuotas`;
  return surchargePct === 0 ? `${label} sin recargo` : `${label} +${percent.format(surchargePct)} %`;
}

export function describePlans(plans: readonly Plan[]): string {
  return [...plans]
    .sort((a, b) => a.installments - b.installments)
    .map(describePlan)
    .join(' · ');
}
