import goldPfp from '@/assets/images/mock-pngs/gold-pfp.png';
import greenPfp from '@/assets/images/mock-pngs/green-pfp.png';
import orangePfp from '@/assets/images/mock-pngs/orange-pfp.png';
import pinkPfp from '@/assets/images/mock-pngs/pink-pfp.png';

import type { PerpPosition } from './PerpSocialChip';

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
  { value: 170.5 }, // Current price should be in range
];

export const ethPriceData = [
  { value: 2565 },
  { value: 2567 },
  { value: 2564 },
  { value: 2568 },
  { value: 2566 },
  { value: 2569 },
  { value: 2568.45 }, // Current price should be in range
];

export const btcPriceData = [
  { value: 109250 },
  { value: 109100 },
  { value: 109300 },
  { value: 108900 },
  { value: 109200 },
  { value: 108950 },
  { value: 109200 }, // Current price should be in range
];

// Mock liquidation prices - replace with actual liquidation price logic
export const liquidationPrices = {
  sol: 169.3,
  eth: 2564.5,
  btc: 108900,
};

// Mock current prices - replace with real-time data
export const currentPrices = {
  sol: 170.5, // Lower than entryPrice 167 for a short, so isProfit true for short
  eth: 2568.45,
  btc: 109200,
};
