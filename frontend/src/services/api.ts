import { mockPrices } from '../mockData/bitcoinPrices';
import { getClientId } from '../utils/clientId';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export interface PriceData {
  timestamp: string;
  price: number;
}

export interface BetResult {
  won: boolean;
  profit: number;
  initialPrice: number;
  finalPrice: number;
  timestamp: string;
}

export interface BetStatusResponse {
  status: 'active' | 'completed';
  result?: BetResult;
  bet?: {
    betType: 'up' | 'down';
    priceAtBet: number;
    timestamp: string;
  };
}

export interface RegisterUserResponse {
  username: string;
  clientId: string;
  message: string;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}

export interface API {
  registerUser: (username: string, clientId?: string) => Promise<RegisterUserResponse>;
  fetchPrices: (currency: string) => Promise<PriceData[]>;
  placeBet: (params: {
    userId: string;
    username: string;
    currency: string;
    betType: 'up' | 'down';
    priceAtBet: number;
  }) => Promise<any>;
  checkBetStatus: (betId: string) => Promise<BetStatusResponse>;
  fetchLeaderboard: () => Promise<LeaderboardEntry[]>;
  getUserStats: (clientId: string) => Promise<any>;
  forgetUser: (clientId: string) => Promise<any>;
}

export const api: API = {
  async fetchPrices(currency: string): Promise<PriceData[]> {
    try {
      if (USE_MOCK_DATA) {
        const mockPrice = mockPrices[Math.floor(Math.random() * mockPrices.length)];
        return [mockPrice].slice(-12);
      }

      const response = await fetch(`${API_URL}/api/bitcoin/prices/${currency.toLowerCase()}`);
      if (!response.ok) throw new Error('Failed to fetch prices');
      
      const data = await response.json();
      return (data.prices || []).slice(-12);

    } catch (error) {
      console.error('Error fetching prices:', error);
      const mockPrice = mockPrices[Math.floor(Math.random() * mockPrices.length)];
      return [mockPrice].slice(-12);
    }
  },

  async registerUser(username: string, clientId?: string): Promise<RegisterUserResponse> {
    console.log('🚀 Starting registration request:', { 
      username, 
      clientId: clientId || getClientId(),
      url: `${API_URL}/api/register-user`
    });
    
    try {
      const response = await fetch(`${API_URL}/api/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username,
          clientId: clientId || getClientId()
        })
      });

      console.log('📥 Raw response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseText = await response.text();
      console.log('📄 Response text:', responseText);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('✅ Registration successful:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Registration error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  async placeBet(params: {
    userId: string;
    username: string;
    currency: string;
    betType: 'up' | 'down';
    priceAtBet: number;
  }) {
    if (USE_MOCK_DATA) {
      return { betId: 'mock-bet-id' };
    }

    const response = await fetch(`${API_URL}/api/place-bet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) throw new Error('Failed to place bet');
    return response.json();
  },

  async checkBetStatus(betId: string): Promise<BetStatusResponse> {
    const response = await fetch(`${API_URL}/api/bet/${betId}`);
    if (!response.ok) throw new Error('Failed to check bet status');
    return response.json();
  },

  fetchLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    try {
      const response = await fetch(`${API_URL}/api/leaderboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      return data.leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  getUserStats: async (clientId: string) => {
    try {
      console.log('�� Fetching stats for clientId:', clientId);
      const response = await fetch(`${API_URL}/api/user/${clientId}/stats`);
      
      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.status} ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      console.log('📊 Parsed user stats:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return { score: 0, wins: 0, losses: 0 };
    }
  },

  forgetUser: async (clientId: string) => {
    const response = await fetch(`${API_URL}/api/user/${clientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const responseText = await response.text();
    console.log('🗑️ Delete user:', { clientId, status: response.status });
    
    if (!response.ok) {
      throw new Error(`Failed to forget user: ${responseText}`);
    }
    
    return JSON.parse(responseText);
  },
}; 