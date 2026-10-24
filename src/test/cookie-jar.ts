type Cookie = { name: string; value: string };

const store = new Map<string, string>();

export const cookieJar = {
  get(name: string): Cookie | undefined {
    const value = store.get(name);
    return value === undefined ? undefined : { name, value };
  },
  set(name: string, value: string): void {
    store.set(name, value);
  },
  delete(name: string): void {
    store.delete(name);
  },
  clear(): void {
    store.clear();
  },
};
