import WebSocket from 'ws';
import axios from 'axios';
import { getCollection } from '../../shared/db';
import { PriceData } from '../../shared/types';

let ws: WebSocket | null = null;
let lastUpdate = 0;
const UPDATE_INTERVAL = 15000; // 15 seconds

interface BinanceTradeEvent {
  e: string;      // Event type
  E: number;      // Event time
  s: string;      // Symbol
  t: number;      // Trade ID
  p: string;      // Price
  q: string;      // Quantity
  b: number;      // Buyer order ID
  a: number;      // Seller order ID
  T: number;      // Trade time
  m: boolean;     // Is the buyer the market maker?
  M: boolean;     // Ignore
}

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
}

async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    return {
      USD: 1,
      EUR: response.data.rates.EUR,
      GBP: response.data.rates.GBP
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return { USD: 1, EUR: 0.85, GBP: 0.73 }; // Fallback rates if API fails
  }
}

export const startWebSocket = () => {
  ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');

  ws.on('message', async (data: WebSocket.RawData) => {
    try {
      const now = Date.now();
      // Only update DB every 15 seconds
      if (now - lastUpdate < UPDATE_INTERVAL) {
        return;
      }

      const trade = JSON.parse(data.toString()) as BinanceTradeEvent;
      const priceUSD = parseFloat(trade.p);

      // Get exchange rates
      const rates = await getExchangeRates();

      // Create price documents for each currency
      const timestamp = new Date();
      const priceData: PriceData[] = [
        {
          timestamp,
          price: priceUSD,
          currency: 'usd'
        },
        {
          timestamp,
          price: priceUSD * rates.EUR,
          currency: 'eur'
        },
        {
          timestamp,
          price: priceUSD * rates.GBP,
          currency: 'gbp'
        }
      ];

      // Save to MongoDB
      const collection = await getCollection('prices');
      await collection.insertMany(priceData);

      // Simple log with just USD price
      const time = new Date().toLocaleTimeString();
      console.log('\x1b[32m%s\x1b[0m', `[${time}] BTC price updated in DB (${priceUSD.toFixed(2)} USD)`);
      
      lastUpdate = now;
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
    reconnect();
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed. Reconnecting...');
    reconnect();
  });
};

const reconnect = () => {
  setTimeout(() => {
    if (ws) {
      ws.terminate();
    }
    startWebSocket();
  }, 5000); // Try to reconnect after 5 seconds
}; 