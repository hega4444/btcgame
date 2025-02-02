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

export const api = {
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

  async registerUser(username: string): Promise<RegisterUserResponse> {
    const response = await fetch(`${API_URL}/api/register-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username,
        clientId: getClientId()
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to register user');
    }

    return response.json();
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
  }
}; 