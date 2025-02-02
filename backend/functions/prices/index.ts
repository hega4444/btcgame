import { APIGatewayProxyHandler } from 'aws-lambda';
import axios from 'axios';
import { getCollection } from '../../shared/db';
import { PriceData } from '../../shared/types';

const REQUIRED_POINTS = 12;
const INTERVAL_SECONDS = 15;
const TIME_WINDOW = REQUIRED_POINTS * INTERVAL_SECONDS * 1000; // 12 * 15 * 1000 = 180000ms = 3 minutes

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const currency = event.pathParameters?.currency?.toLowerCase() || 'usd';
    
    // Get prices from MongoDB for the last REQUIRED_POINTS intervals
    const pricesCollection = await getCollection('prices');
    const timeWindowAgo = new Date(Date.now() - TIME_WINDOW);
    
    const prices = await pricesCollection
      .find({ 
        currency,
        timestamp: { $gte: timeWindowAgo }
      })
      .sort({ timestamp: -1 })
      .limit(REQUIRED_POINTS)
      .toArray();

    // If we have all required points, return them
    if (prices.length === REQUIRED_POINTS) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          currency,
          prices: prices.reverse()
        })
      };
    }

    // If we're missing points, fetch historical data from CoinGecko
    const now = Math.floor(Date.now() / 1000);
    const threeMinutesAgoUnix = now - (3 * 60);
    
    const historicalResponse = await axios.get(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range`, {
        params: {
          vs_currency: currency,
          from: threeMinutesAgoUnix,
          to: now
        }
      }
    );

    // Process historical prices
    const historicalPrices = historicalResponse.data.prices.map(
      ([timestamp, price]: [number, number]) => ({
        timestamp: new Date(timestamp),
        price,
        currency
      })
    );

    // Store historical prices in MongoDB
    if (historicalPrices.length > 0) {
      await pricesCollection.insertMany(historicalPrices);
    }

    // Get the last REQUIRED_POINTS prices
    const allPrices = [...prices, ...historicalPrices]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, REQUIRED_POINTS)
      .reverse();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        currency,
        prices: allPrices
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch Bitcoin price' })
    };
  }
}; 