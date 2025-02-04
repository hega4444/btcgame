import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { Bet } from '../../shared/types';
import { ObjectId } from 'mongodb';

/**
 * Bet Placement Handler
 * 
 * Processes new bet placements and initializes bet tracking.
 * Validates bet parameters and records initial conditions.
 * 
 * Features:
 * - Bet validation
 * - Price snapshot recording
 * - Bet tracking initialization
 * - User verification
 * 
 * Request Body:
 * - userId: User's identifier
 * - currency: Betting currency
 * - betType: 'up' or 'down'
 */

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { userId: clientId, currency, betType } = JSON.parse(event.body || '{}');
    
    if (!clientId || !currency || !betType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get username for logging first
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ clientId });
    const username = user?.username || 'Unknown User';

    // Check for active bets
    const betsCollection = await getCollection('bets');
    const activeBet = await betsCollection.findOne({
      clientId,
      status: 'active'
    });

    if (activeBet) {
      console.log(`User ${clientId} (${username}) attempted to place ${betType} bet while having active bet`);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Active bet exists',
          message: 'You still have active bets'
        })
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

    // Create a new ObjectId first
    const betId = new ObjectId();
    console.log('Generated betId:', betId.toString());

    // Create bet with the guaranteed _id and current timestamp
    const bet: Bet = {
      _id: betId,
      clientId,
      currency,
      betType,
      priceAtBet: latestPrice.price,
      timestamp: new Date(), // Ensure this is a current timestamp
      status: 'active'
    };

    await betsCollection.insertOne(bet);

    // Log the bet placement with formatted price
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(latestPrice.price);

    console.log(`🎲 New Bet: ${username} bet ${betType.toUpperCase()} on BTC/${currency.toUpperCase()} at ${formattedPrice}`);
    console.log(`   Timestamp: ${bet.timestamp.toISOString()}`); // Add timestamp to log

    // Before returning
    const returnBetId = betId.toString();
    console.log('Returning betId to frontend:', returnBetId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Bet placed successfully',
        betId: returnBetId,
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