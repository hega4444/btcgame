/**
 * Shared Type Definitions
 * 
 * Core type definitions used throughout the application.
 * Defines interfaces for data models and API responses.
 * 
 * Types:
 * - PriceData: Bitcoin price information
 * - UserProfile: User account details
 * - Bet: Betting transaction data
 * - BetResult: Bet outcome information
 * - BetStatusResponse: Bet status API response
 * 
 * Note: These types are shared between frontend and backend
 */

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
  wins: number;
  losses: number;
  score: number;
}

export interface Bet {
  _id?: ObjectId;
  clientId: string;  // Changed from userId
  currency: string;
  betType: 'up' | 'down';
  priceAtBet: number;
  timestamp: Date;
  status: 'active' | 'completed';
  result?: {    // Add result field
    won: boolean;
    finalPrice: number;
    completedAt: Date;
  };
}

export interface BetResult {
  _id?: ObjectId;
  betId: string;
  clientId: string;  // Changed from userId to clientId
  won: boolean;
  profit: number;
  initialPrice: number;
  finalPrice: number;
  timestamp: Date;
}

export interface BetStatusResponse {
  status: 'active' | 'completed';
  result?: BetResult;
  bet?: Bet;
} 