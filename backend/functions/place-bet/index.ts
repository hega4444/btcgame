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

    // Get current price
    const pricesCollection = await getCollection('prices');
    const latestPrice = await pricesCollection.findOne(
      { currency: currency.toLowerCase() },
      { sort: { timestamp: -1 } }
    );

    if (!latestPrice) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No price data available' })
      };
    }

    // Get username for logging
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ clientId: userId });
    const username = user?.username || 'Unknown User';

    // Create a new ObjectId first
    const betId = new ObjectId();

    // Create bet with the guaranteed _id and current timestamp
    const bet: Bet = {
      _id: betId,
      userId,
      currency,
      betType,
      priceAtBet: latestPrice.price,
      timestamp: new Date(), // Ensure this is a current timestamp
      status: 'active'
    };

    const betsCollection = await getCollection('bets');
    await betsCollection.insertOne(bet);

    // Log the bet placement with formatted price
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(latestPrice.price);

    console.log(`🎲 New Bet: ${username} bet ${betType.toUpperCase()} on BTC/${currency.toUpperCase()} at ${formattedPrice}`);
    console.log(`   Timestamp: ${bet.timestamp.toISOString()}`); // Add timestamp to log

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Bet placed successfully',
        betId: betId.toString(),
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