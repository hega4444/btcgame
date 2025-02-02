import { EventBridgeHandler } from 'aws-lambda';
import axios from 'axios';
import { getCollection } from '../../shared/db';
import { PriceData } from '../../shared/types';

// Helper function to round to 3 decimal places
const roundToThree = (num: number): number => {
  return Number(Math.round(Number(num + 'e3')) + 'e-3');
};

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

  } catch (error) {
    console.error('Error updating prices:', error);
    throw error;
  }
}; 