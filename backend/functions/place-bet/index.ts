import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { Bet } from '../../shared/types';
import { ObjectId } from 'mongodb';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { userId, currency, betType } = JSON.parse(event.body || '{}');
    
    if (!userId || !currency || !betType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const betsCollection = await getCollection('bets');
    
    // Create new ObjectId for the bet
    const betId = new ObjectId();
    
    const bet: Bet = {
      _id: betId,
      userId,
      currency: currency.toLowerCase(),
      betType,
      priceAtBet: 0, // Will be set from prices collection
      timestamp: new Date(),
      status: 'active'
    };

    // Get current price
    const pricesCollection = await getCollection('prices');
    const currentPrice = await pricesCollection
      .find({ currency: bet.currency })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (!currentPrice.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Could not get current price' })
      };
    }

    bet.priceAtBet = currentPrice[0].price;

    await betsCollection.insertOne(bet);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        betId: betId.toString(), // Convert ObjectId to string for frontend
        message: 'Bet placed successfully',
        priceAtBet: bet.priceAtBet,
        timestamp: bet.timestamp
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to place bet' })
    };
  }
}; 