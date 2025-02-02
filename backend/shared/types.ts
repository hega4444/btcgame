import { ObjectId } from 'mongodb';

export interface PriceData {
  timestamp: Date;
  price: number;
  currency: string;
}

export interface UserProfile {
  _id?: ObjectId;
  clientId: string;  // ID from frontend cookie
  username: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface Bet {
  _id?: ObjectId;
  userId: string;
  currency: string;
  betType: 'up' | 'down';
  priceAtBet: number;
  timestamp: Date;
  status: 'active' | 'completed';
}

export interface BetResult {
  _id?: ObjectId;
  betId: string;
  userId: string;
  won: boolean;
  profit: number;
  initialPrice: number;
  finalPrice: number;
  timestamp: Date;
}

export interface UserScore {
  _id?: ObjectId;
  userId: string;
  username: string;
  wins: number;
  losses: number;
  lastUpdated: Date;
}

export interface BetStatusResponse {
  status: 'active' | 'completed';
  result?: BetResult;
  bet?: Bet;
} 