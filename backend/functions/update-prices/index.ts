import { ScheduledHandler } from 'aws-lambda';
import axios from 'axios';
import { getCollection } from '../../shared/db';

export const handler: ScheduledHandler = async () => {
  try {
    const pricesCollection = await getCollection('prices');
    const currencies = ['usd', 'eur', 'gbp'];
    
    // Fetch prices for all supported currencies in one call
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: currencies.join(',')
      }
    });

    const timestamp = new Date();
    
    // Insert a price document for each currency
    const priceInserts = currencies.map(currency => ({
      timestamp,
      price: response.data.bitcoin[currency],
      currency
    }));

    await pricesCollection.insertMany(priceInserts);
    
    console.log('Successfully updated prices for all currencies');
    
  } catch (error) {
    console.error('Error updating prices:', error);
    throw error;
  }
}; 