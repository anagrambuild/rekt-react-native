import mockPfp from '@/assets/images/mock-pngs/green-pfp.png';

import type { TradeActivityCardProps } from './TradeActivityCard';

export const userMockData = {
  username: 'liamdig',
  imgSrc: mockPfp,
  balance: 28500,
  points: 72000,
  isProfit: true,
  percentage: 28.5,
};

export const tradeActivityMockData: TradeActivityCardProps[] = [
  {
    type: 'long',
    symbol: 'btc',
    amount: 100,
    leverage: 2,
    percentage: 10,
    isProfit: true,
  },
  {
    type: 'short',
    symbol: 'eth',
    amount: 250,
    leverage: 3,
    percentage: -5,
    isProfit: false,
  },
  {
    type: 'long',
    symbol: 'sol',
    amount: 75,
    leverage: 5,
    percentage: 22,
    isProfit: true,
  },
  {
    type: 'short',
    symbol: 'btc',
    amount: 180,
    leverage: 1,
    percentage: -8,
    isProfit: false,
  },
  {
    type: 'long',
    symbol: 'eth',
    amount: 320,
    leverage: 4,
    percentage: 15,
    isProfit: true,
  },
  {
    type: 'short',
    symbol: 'sol',
    amount: 60,
    leverage: 2,
    percentage: -3,
    isProfit: false,
  },
  {
    type: 'long',
    symbol: 'btc',
    amount: 210,
    leverage: 3,
    percentage: 18,
    isProfit: true,
  },
  {
    type: 'short',
    symbol: 'eth',
    amount: 90,
    leverage: 2,
    percentage: -12,
    isProfit: false,
  },
];
