import { slugify as slugifyLib } from 'transliteration';

export function slugify(text: string) {
  return slugifyLib(text, {
    lowercase: true,
    separator: '-',
  });
}
