import en from './en.json';

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<typeof en>;

/** Looks up a UI string in en.json and fills `{name}` placeholders. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let value: unknown = en;
  for (const part of key.split('.')) value = (value as Record<string, unknown>)[part];
  const text = typeof value === 'string' ? value : key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : text;
}

/** Picks the singular or plural form: keys `<base>.one` and `<base>.other`. */
export function plural(base: 'count.plugins' | 'count.agents' | 'count.skills' | 'count.results', n: number): string {
  return t(`${base}.${n === 1 ? 'one' : 'other'}` as MessageKey, { n });
}
