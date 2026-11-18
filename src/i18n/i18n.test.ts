import { describe, expect, it } from 'vitest';
import esCO from './locales/es-CO';
import en from './locales/en';
import ptBR from './locales/pt-BR';
import { PHASES, PROTOCOLS } from '../domain';
import { normalizeLanguage } from './index';

function keys(o: unknown, prefix = ''): string[] {
  if (typeof o !== 'object' || o === null) return [prefix];
  return Object.entries(o).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}
const master = keys(esCO).sort();

describe('translations', () => {
  for (const [name, t] of [['en', en], ['pt-BR', ptBR]] as const) {
    it(`${name} has the same keys as es-CO`, () => {
      expect(keys(t).sort()).toEqual(master);
    });
    it(`${name} has no empty strings and same placeholders`, () => {
      const flat = (o: unknown): Record<string, string> => Object.fromEntries(keys(o).map((k) => [k, k.split('.').reduce((a: any, p) => a[p], o)]));
      const base = flat(esCO); const cur = flat(t);
      for (const k of master) {
        expect(cur[k], k).toBeTruthy();
        const ph = (s: string) => (s.match(/{{\w+}}/g) ?? []).sort().join();
        expect(ph(cur[k]), k).toBe(ph(base[k]));
      }
    });
  }
  it('covers every phase and protocol', () => {
    for (const p of PHASES) expect((esCO.phases as any)[p.id]?.title).toBeTruthy();
    for (const p of PROTOCOLS) expect((esCO.protocols as any)[p.id]?.label).toBeTruthy();
  });
  it('normalizes language codes', () => {
    expect(normalizeLanguage('pt-PT')).toBe('pt-BR');
    expect(normalizeLanguage('en-US')).toBe('en');
    expect(normalizeLanguage('es-MX')).toBe('es-CO');
    expect(normalizeLanguage('fr')).toBeUndefined();
  });
});
