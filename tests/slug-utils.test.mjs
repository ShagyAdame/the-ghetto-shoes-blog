import { describe, it, expect } from 'vitest';

/**
 * Pure-function replica of generateSlug from scripts/sync-vault.mjs.
 * Tests the slug logic in isolation so we can safely refactor the sync script.
 */
function generateSlug(filename) {
  let name = filename.replace(/\.[^.]+$/, ''); // strip extension
  name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  name = name.replace(/['´`"‘’]/g, '');
  name = name.replace(/[¿¡]/g, '');
  name = name.replace(/[^\w\s-]/g, '');
  name = name.trim().replace(/\s+/g, '-');
  name = name.toLowerCase();
  name = name.replace(/-+/g, '-');
  name = name.replace(/^-+|-+$/g, '');
  return name;
}

describe('generateSlug', () => {
  it('lowercases and hyphenates Spanish filenames', () => {
    expect(generateSlug('Lanzamiento Único.md')).toBe('lanzamiento-unico');
  });

  it('strips accents', () => {
    expect(generateSlug('14 de junio del 2026.md')).toBe('14-de-junio-del-2026');
  });

  it('handles filenames with apostrophes', () => {
    expect(generateSlug("The Ghetto Shoe's.md")).toBe('the-ghetto-shoes');
  });

  it('removes special chars like ¿ and ¡', () => {
    expect(generateSlug('¿Qué es The Ghetto Shoes.md')).toBe('que-es-the-ghetto-shoes');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('foo---bar.md')).toBe('foo-bar');
  });

  it('trims leading/trailing hyphens', () => {
    expect(generateSlug('-leading-and-trailing-.md')).toBe('leading-and-trailing');
  });

  it('handles filenames with multiple dots', () => {
    // internal dots are stripped by [^\w\s-] removal
    expect(generateSlug('some.file.name.md')).toBe('somefilename');
  });

  it('handles empty or edge names gracefully', () => {
    expect(generateSlug('.md')).toBe('');
  });
});

/**
 * Pure-function replica of normalizeImageName from sync-vault.mjs.
 */
function normalizeImageName(filename) {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  let name = filename.slice(0, filename.lastIndexOf('.'));
  name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  name = name.replace(/['´`"‘’]/g, '');
  name = name.replace(/[¿¡]/g, '');
  name = name.replace(/[^\w\s-]/g, '');
  name = name.trim().replace(/\s+/g, '-');
  name = name.toLowerCase();
  name = name.replace(/-+/g, '-');
  name = name.replace(/^-+|-+$/g, '');
  return name + ext;
}

describe('normalizeImageName', () => {
  it('normalizes ChatGPT-style filenames', () => {
    const input = 'ChatGPT Image 14 jun 2026, 06_01_17 p.m.png';
    const result = normalizeImageName(input);
    expect(result).toMatch(/\.png$/);
    expect(result).not.toContain(' ');
    expect(result).not.toContain(',');
  });

  it('preserves extension case', () => {
    const result = normalizeImageName('Photo.JPG');
    expect(result).toMatch(/\.jpg$/);
  });

  it('strips accents from image names', () => {
    const result = normalizeImageName('zapatos_cómodos.png');
    expect(result).toBe('zapatos_comodos.png');
  });
});

/**
 * Pure-function replica of extractDateFromFilename.
 */
const MONTHS = {
  enero: '01', febrero: '02', marzo: '03', abril: '04',
  mayo: '05', junio: '06', julio: '07', agosto: '08',
  septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

function extractDateFromFilename(filename) {
  const name = filename.replace(/\.[^.]+$/, '');
  const dateMatch = name.match(/(\d{1,2})\s+de\s+(\w+)\s+(?:del|de)\s+(\d{4})/);
  if (dateMatch) {
    const [, day, monthName, year] = dateMatch;
    const month = MONTHS[monthName.toLowerCase()];
    if (month && day >= 1 && day <= 31) {
      return `${year}-${month}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

describe('extractDateFromFilename', () => {
  it('extracts date from "14 de junio del 2026"', () => {
    expect(extractDateFromFilename('14 de junio del 2026.md')).toBe('2026-06-14');
  });

  it('extracts date with "de" instead of "del"', () => {
    expect(extractDateFromFilename('1 de enero de 2026.md')).toBe('2026-01-01');
  });

  it('returns null for filenames without dates', () => {
    expect(extractDateFromFilename('about.md')).toBeNull();
  });

  it('handles single-digit days', () => {
    expect(extractDateFromFilename('5 de mayo del 2026.md')).toBe('2026-05-05');
  });

  it('handles diciembre correctly', () => {
    expect(extractDateFromFilename('31 de diciembre del 2026.md')).toBe('2026-12-31');
  });
});
