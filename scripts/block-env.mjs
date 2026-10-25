const ALLOWED = new Set(['.env.example', '.env.test']);
const ENV_FILE = /^\.env(\..+)?$/;

const blocked = process.argv.slice(2).filter((file) => {
  const name = file.split(/[\\/]/).pop() ?? '';
  return ENV_FILE.test(name) && !ALLOWED.has(name);
});

if (blocked.length > 0) {
  console.error(`Commit bloqueado: no se commitean archivos .env reales (${blocked.join(', ')}).`);
  console.error('Sólo se versionan .env.example y .env.test. Sacalo del stage con: git restore --staged <archivo>');
  process.exit(1);
}
