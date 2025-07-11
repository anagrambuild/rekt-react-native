import diamond from '@/assets/images/mock-pngs/diamond.png';
import goldPfp from '@/assets/images/mock-pngs/gold-pfp.png';
import greenPfp from '@/assets/images/mock-pngs/green-pfp.png';
import orangePfp from '@/assets/images/mock-pngs/orange-pfp.png';
import pinkPfp from '@/assets/images/mock-pngs/pink-pfp.png';
import usdc from '@/assets/images/mock-pngs/usdc.png';

import type { PerpPosition } from './homeComponents/PerpSocialChip';

// mock data for tokens at top of screen
export const tokens = [
  { id: 0, imgSrc: diamond, value: '58K' },
  { id: 1, imgSrc: usdc, value: '69000' },
];

export const perpSocials: {
  id: number;
  imgSrc: any;
  position: PerpPosition;
  meta: string;
  earningMultiple: number | null;
}[] = [
  {
    id: 0,
    imgSrc: goldPfp,
    position: 'long',
    meta: '100x at $163.20',
    earningMultiple: null,
  },
  {
    id: 1,
    imgSrc: pinkPfp,
    position: 'short',
    meta: '20x at $158.90',
    earningMultiple: null,
  },
  {
    id: 2,
    imgSrc: greenPfp,
    position: 'won',
    meta: '+200%',
    earningMultiple: 2,
  },
  {
    id: 3,
    imgSrc: orangePfp,
    position: 'lost',
    meta: '-58%',
    earningMultiple: null,
  },
  {
    id: 4,
    imgSrc: pinkPfp,
    position: 'lost',
    meta: 'Got rekt',
    earningMultiple: null,
  },
];

// Realistic mock price data for charts
export const solPriceData = [
  { value: 167 },
  { value: 168 },
  { value: 167.5 },
  { value: 169 },
  { value: 168.2 },
  { value: 170 },
  { value: 169.7 }, // Mixed trend
];

export const ethPriceData = [
  { value: 2565 },
  { value: 2567 },
  { value: 2564 },
  { value: 2568 },
  { value: 2566 },
  { value: 2569 },
  { value: 2563 }, // Mixed trend
];

export const btcPriceData = [
  { value: 109250 },
  { value: 109100 },
  { value: 109300 },
  { value: 108900 },
  { value: 109200 },
  { value: 108950 },
  { value: 109261 }, // Mixed trend
];
