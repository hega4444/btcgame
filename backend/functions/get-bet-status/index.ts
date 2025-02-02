import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { Bet, BetResult } from '../../shared/types';
import { ObjectId } from 'mongodb';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const betId = event.pathParameters?.betId;

    if (!betId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing betId' })
      };
    }

    // Convert string ID to ObjectId
    const objectId = new ObjectId(betId);

    // Get bet details
    const betsCollection = await getCollection('bets');
    const bet = await betsCollection.findOne({ _id: objectId });

    if (!bet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Bet not found' })
      };
    }

    // If bet is still active, check if it should be completed
    if (bet.status === 'active') {
      // Get current price
      const pricesCollection = await getCollection('prices');
      const currentPrice = await pricesCollection
        .find({ currency: bet.currency })
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();

      if (currentPrice.length > 0) {
        const finalPrice = currentPrice[0].price;
        const priceChange = finalPrice - bet.priceAtBet;
        const won = (bet.betType === 'up' && priceChange > 0) || 
                   (bet.betType === 'down' && priceChange < 0);

        // Create bet result
        const betResult: BetResult = {
          betId: objectId.toString(),
          userId: bet.userId,
          won,
          profit: won ? 1 : -1, // Simple win/loss for now
          initialPrice: bet.priceAtBet,
          finalPrice,
          timestamp: new Date()
        };

        // Update bet status and save result
        await betsCollection.updateOne(
          { _id: objectId },
          { $set: { status: 'completed' } }
        );

        const resultsCollection = await getCollection('betResults');
        await resultsCollection.insertOne(betResult);

        // Update user stats
        const usersCollection = await getCollection('users');
        await usersCollection.updateOne(
          { userId: bet.userId },
          { 
            $inc: { 
              wins: won ? 1 : 0,
              losses: won ? 0 : 1
            },
            $set: { lastUpdated: new Date() }
          }
        );

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            status: 'completed',
            result: betResult
          })
        };
      }
    }

    // If bet is already completed, return the result
    if (bet.status === 'completed') {
      const resultsCollection = await getCollection('betResults');
      const result = await resultsCollection.findOne({ betId: objectId.toString() });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'completed',
          result
        })
      };
    }

    // If bet is still active and no current price, return active status
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'active',
        bet
      })
    };

  } catch (error) {
    console.error('Error getting bet status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get bet status' })
    };
  }
}; 