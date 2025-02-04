import { EventBridgeHandler } from 'aws-lambda';
import axios from 'axios';
import { getCollection } from '../../shared/db';
import { PriceData } from '../../shared/types';
import { checkBetStatus } from '../get-bet-status';

/**
 * Price Update Handler
 * 
 * Fetches and stores current Bitcoin prices from external APIs.
 * Handles price updates for multiple currencies and triggers bet processing.
 * 
 * Features:
 * - Real-time price fetching from Binance
 * - Multi-currency support (USD, EUR, GBP)
 * - Automatic bet resolution
 * - Price data storage
 * - Cleanup of unprocessed bets
 * 
 * Environment Variables:
 * - BET_TIMER_SECONDS: Duration for bet resolution
 */

// Helper function to round to 3 decimal places
const roundToThree = (num: number): number => {
  return Number(Math.round(Number(num + 'e3')) + 'e-3');
};

const CLEANUP_THRESHOLD = (process.env.BET_TIMER_SECONDS ? parseInt(process.env.BET_TIMER_SECONDS) * 1000 : 5000) + 100; // BET_TIMER_SECONDS + 100ms

async function cleanupUnprocessedBets() {
  try {
    const betsCollection = await getCollection('bets');
    const now = new Date();
    
    // Find active bets that are older than threshold
    const unprocessedBets = await betsCollection
      .find({
        status: 'active',
        timestamp: { 
          $lt: new Date(now.getTime() - CLEANUP_THRESHOLD) 
        }
      })
      .toArray();

    console.log(`Found ${unprocessedBets.length} unprocessed bets to cleanup`);

    // Process each unprocessed bet
    for (const bet of unprocessedBets) {
      try {
        await checkBetStatus(bet._id.toString());
        console.log(`Cleaned up bet ${bet._id}`);
      } catch (error) {
        console.error(`Failed to cleanup bet ${bet._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in cleanupUnprocessedBets:', error);
  }
}

export const handler: EventBridgeHandler<'Scheduled Event', any, void> = async () => {
  try {
    // Get BTC price from Binance
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: {
        symbol: 'BTCUSDT'
      }
    });

    const priceUSD = roundToThree(parseFloat(response.data.price));

    // Get exchange rates
    const ratesResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const rates = {
      USD: 1,
      EUR: ratesResponse.data.rates.EUR,
      GBP: ratesResponse.data.rates.GBP
    };

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
        price: roundToThree(priceUSD * rates.EUR),
        currency: 'eur'
      },
      {
        timestamp,
        price: roundToThree(priceUSD * rates.GBP),
        currency: 'gbp'
      }
    ];

    // Save to MongoDB
    const collection = await getCollection('prices');
    await collection.insertMany(priceData);

    // Log only USD price
    const time = new Date().toLocaleTimeString();
    console.log('\x1b[32m%s\x1b[0m', `[${time}] BTC price updated in DB (${priceUSD.toFixed(3)} USD)`);

    // Add cleanup after price update
    await cleanupUnprocessedBets();

  } catch (error) {
    console.error('Error updating prices:', error);
    throw error;
  }
}; 