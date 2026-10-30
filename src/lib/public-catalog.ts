export function isCatalogPublic(): boolean {
  return process.env.PUBLIC_CATALOG === 'true';
}
