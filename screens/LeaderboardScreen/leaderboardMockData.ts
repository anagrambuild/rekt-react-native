export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  score: number;
  avatar: any; // Image source
}

export interface PnlEntry {
  id: string;
  rank: number;
  username: string;
  amount: number;
  avatar: any;
  isWinner: boolean;
}

export const leaderboardMockData: LeaderboardEntry[] = [
  {
    id: "1",
    rank: 1,
    username: "ledgerlegend",
    score: 9876,
    avatar: require("@/assets/images/mock-pngs/leaderboard-1.png"),
  },
  {
    id: "2",
    rank: 2,
    username: "miningmaverick",
    score: 8543,
    avatar: require("@/assets/images/mock-pngs/leaderboard-2.png"),
  },
  {
    id: "3",
    rank: 3,
    username: "tokentrader",
    score: 7210,
    avatar: require("@/assets/images/mock-pngs/leaderboard-3.png"),
  },
  {
    id: "4",
    rank: 4,
    username: "whalewatcher",
    score: 6789,
    avatar: require("@/assets/images/mock-pngs/leaderboard-4.png"),
  },
  {
    id: "5",
    rank: 5,
    username: "defidealer",
    score: 5432,
    avatar: require("@/assets/images/mock-pngs/leaderboard-5.png"),
  },
  {
    id: "6",
    rank: 6,
    username: "blockchainbandit",
    score: 5432,
    avatar: require("@/assets/images/mock-pngs/leaderboard-6.png"),
  },
  {
    id: "7",
    rank: 7,
    username: "coincollector",
    score: 5432,
    avatar: require("@/assets/images/mock-pngs/leaderboard-7.png"),
  },
  {
    id: "8",
    rank: 8,
    username: "decentralizeddreamer",
    score: 5432,
    avatar: require("@/assets/images/mock-pngs/leaderboard-8.png"),
  },
];

// Winners P&L data - reusing existing leaderboard data
export const winnersPnlMockData: PnlEntry[] = [
  {
    id: "w1",
    rank: 1,
    username: "ledgerlegend",
    amount: 9876,
    avatar: require("@/assets/images/mock-pngs/leaderboard-1.png"),
    isWinner: true,
  },
  {
    id: "w2",
    rank: 2,
    username: "miningmaverick",
    amount: 8543,
    avatar: require("@/assets/images/mock-pngs/leaderboard-2.png"),
    isWinner: true,
  },
  {
    id: "w3",
    rank: 3,
    username: "tokentrader",
    amount: 7210,
    avatar: require("@/assets/images/mock-pngs/leaderboard-3.png"),
    isWinner: true,
  },
  {
    id: "w4",
    rank: 4,
    username: "whalewatcher",
    amount: 6789,
    avatar: require("@/assets/images/mock-pngs/leaderboard-4.png"),
    isWinner: true,
  },
  {
    id: "w5",
    rank: 5,
    username: "defidealer",
    amount: 5432,
    avatar: require("@/assets/images/mock-pngs/leaderboard-5.png"),
    isWinner: true,
  },
];

// Losers P&L data
export const losersPnlMockData: PnlEntry[] = [
  {
    id: "l1",
    rank: 1,
    username: "blockchainbandit",
    amount: 29876,
    avatar: require("@/assets/images/mock-pngs/leaderboard-6.png"),
    isWinner: false,
  },
  {
    id: "l2",
    rank: 2,
    username: "coincollector",
    amount: 18543,
    avatar: require("@/assets/images/mock-pngs/leaderboard-7.png"),
    isWinner: false,
  },
  {
    id: "l3",
    rank: 3,
    username: "decentralizeddreamer",
    amount: 15210,
    avatar: require("@/assets/images/mock-pngs/leaderboard-8.png"),
    isWinner: false,
  },
  {
    id: "l4",
    rank: 4,
    username: "cryptocrasher",
    amount: 12890,
    avatar: require("@/assets/images/mock-pngs/gray-pfp.png"),
    isWinner: false,
  },
  {
    id: "l5",
    rank: 5,
    username: "rektwarrior",
    amount: 9876,
    avatar: require("@/assets/images/mock-pngs/orange-pfp.png"),
    isWinner: false,
  },
];
