import { PhotoPreset } from '../types';

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: 'passport-26x34',
    name: 'Standard Passport (26 x 34 mm) India',
    category: 'passport',
    widthMm: 26,
    heightMm: 34,
    description: 'India'
  },
  {
    id: 'passport-35-45',
    name: 'Standard Passport (35 x 45 mm)',
    category: 'passport',
    widthMm: 35,
    heightMm: 45,
    description: 'UK, EU, Schengen, Australia, India, Singapore, New Zealand'
  },
  {
    id: 'us-passport-2x2',
    name: 'US Passport / Visa (2 x 2 in)',
    category: 'passport',
    widthMm: 50.8,
    heightMm: 50.8,
    description: 'United States, India OCI, Colombia'
  },
  {
    id: 'canada-passport',
    name: 'Canada Passport (50 x 70 mm)',
    category: 'passport',
    widthMm: 50,
    heightMm: 70,
    description: 'Canada Official Passport & Visa'
  },
  {
    id: 'china-visa',
    name: 'China Visa (33 x 48 mm)',
    category: 'visa',
    widthMm: 33,
    heightMm: 48,
    description: 'Chinese Visa & Tourist Permits'
  },
  {
    id: 'japan-visa',
    name: 'Japan Visa (35 x 45 mm)',
    category: 'visa',
    widthMm: 35,
    heightMm: 45,
    description: 'Japan Visa and Certificate of Eligibility'
  },
  {
    id: 'stamp-size',
    name: 'Stamp Size (20 x 25 mm)',
    category: 'standard',
    widthMm: 20,
    heightMm: 25,
    description: 'Small documents, badges, job IDs'
  },
  {
    id: 'print-4x6',
    name: '4 x 6 in Photo Print',
    category: 'print',
    widthMm: 101.6,
    heightMm: 152.4,
    description: 'Standard 10 x 15 cm photo paper'
  },
  {
    id: 'print-5x7',
    name: '5 x 7 in Photo Print',
    category: 'print',
    widthMm: 127.0,
    heightMm: 177.8,
    description: 'Standard desktop frame print'
  },
  {
    id: 'print-6x8',
    name: '6 x 8 in Photo Print',
    category: 'print',
    widthMm: 152.4,
    heightMm: 203.2,
    description: 'Large portrait print'
  }
];

export const DEFAULT_PRESET = PHOTO_PRESETS[0];