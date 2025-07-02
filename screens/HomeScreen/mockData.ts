import type { PerpPosition } from './homeComponents/PerpSocialChip';
import diamond from '@/assets/images/mock-pngs/diamond.png';
import goldPfp from '@/assets/images/mock-pngs/gold-pfp.png';
import greenPfp from '@/assets/images/mock-pngs/green-pfp.png';
import orangePfp from '@/assets/images/mock-pngs/orange-pfp.png';
import pinkPfp from '@/assets/images/mock-pngs/pink-pfp.png';
import usdc from '@/assets/images/mock-pngs/usdc.png';

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
