export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  score: number;
  avatar: any; // Image source
}

export const leaderboardMockData: LeaderboardEntry[] = [
  {
    id: '1',
    rank: 1,
    username: 'ledgerlegend',
    score: 9876,
    avatar: require('@/assets/images/mock-pngs/leaderboard-1.png'),
  },
  {
    id: '2',
    rank: 2,
    username: 'miningmaverick',
    score: 8543,
    avatar: require('@/assets/images/mock-pngs/leaderboard-2.png'),
  },
  {
    id: '3',
    rank: 3,
    username: 'tokentrader',
    score: 7210,
    avatar: require('@/assets/images/mock-pngs/leaderboard-3.png'),
  },
  {
    id: '4',
    rank: 4,
    username: 'whalewatcher',
    score: 6789,
    avatar: require('@/assets/images/mock-pngs/leaderboard-4.png'),
  },
  {
    id: '5',
    rank: 5,
    username: 'defidealer',
    score: 5432,
    avatar: require('@/assets/images/mock-pngs/leaderboard-5.png'),
  },
  {
    id: '6',
    rank: 6,
    username: 'blockchainbandit',
    score: 5432,
    avatar: require('@/assets/images/mock-pngs/leaderboard-6.png'),
  },
  {
    id: '7',
    rank: 7,
    username: 'coincollector',
    score: 5432,
    avatar: require('@/assets/images/mock-pngs/leaderboard-7.png'),
  },
  {
    id: '8',
    rank: 8,
    username: 'decentralizeddreamer',
    score: 5432,
    avatar: require('@/assets/images/mock-pngs/leaderboard-8.png'),
  },
];
