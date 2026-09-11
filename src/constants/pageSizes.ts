import { PageSizePreset } from '../types';

export const PAGE_SIZES: PageSizePreset[] = [
  {
    id: 'a4',
    name: 'A4',
    widthMm: 210,
    heightMm: 297,
    description: '210 x 297 mm — Global Standard Document'
  },
  {
    id: '4x6',
    name: '4 x 6 in (10 x 15 cm)',
    widthMm: 101.6,
    heightMm: 152.4,
    description: 'Most popular drugstore photo sheet (CVS, Walgreens, Walmart)'
  },
  {
    id: 'letter',
    name: 'US Letter',
    widthMm: 215.9,
    heightMm: 279.4,
    description: '8.5 x 11 in — North American Standard'
  },
  {
    id: 'a3',
    name: 'A3',
    widthMm: 297,
    heightMm: 420,
    description: '297 x 420 mm — Large Format Print'
  },
  {
    id: 'a5',
    name: 'A5',
    widthMm: 148,
    heightMm: 210,
    description: '148 x 210 mm — Half A4'
  },
  {
    id: '5x7',
    name: '5 x 7 in',
    widthMm: 127,
    heightMm: 177.8,
    description: '127 x 178 mm — Medium Photo Sheet'
  },
  {
    id: 'legal',
    name: 'US Legal',
    widthMm: 215.9,
    heightMm: 355.6,
    description: '8.5 x 14 in'
  },
  {
    id: 'b5',
    name: 'JIS B5',
    widthMm: 182,
    heightMm: 257,
    description: '182 x 257 mm'
  },
  {
    id: 'b6',
    name: 'JIS B6',
    widthMm: 128,
    heightMm: 182,
    description: '128 x 182 mm'
  },
  {
    id: 'custom',
    name: 'Custom Dimensions',
    widthMm: 210,
    heightMm: 297,
    description: 'Enter your custom width and height'
  }
];

export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];