import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { Bet, BetResult, BetStatusResponse } from '../../shared/types';
import { ObjectId } from 'mongodb';

const BET_DURATION = parseInt(process.env.BET_TIMER_SECONDS || '60') * 1000; // Convert to milliseconds
const FORCE_ALTERNATE = process.env.FORCE_ALTERNATE_RESULTS === 'true';

// Add this to track alternating results and processed bets
let lastWasWin = false;
const processedBets = new Set<string>();

const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(price);

export const checkBetStatus = async (betId: string) => {
  const betsCollection = await getCollection('bets');
  const objectId = new ObjectId(betId);
  const bet = await betsCollection.findOne({ _id: objectId });

  if (!bet || bet.status === 'completed') {
    return null;
  }

  const now = new Date();
  const betTime = new Date(bet.timestamp);
  const betAge = now.getTime() - betTime.getTime();
  
  if (betAge >= BET_DURATION) {
    const pricesCollection = await getCollection('prices');
    const currentPrice = await pricesCollection
      .find({ currency: bet.currency.toLowerCase() })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (!currentPrice.length) {
      throw new Error('No current price available');
    }

    const finalPrice = currentPrice[0].price;
    const priceChange = finalPrice - bet.priceAtBet;
    const won = (bet.betType === 'up' && priceChange > 0) || 
                (bet.betType === 'down' && priceChange < 0);

    // Update bet with result
    await betsCollection.updateOne(
      { _id: objectId },
      { 
        $set: { 
          status: 'completed',
          result: {
            won,
            finalPrice,
            completedAt: new Date()
          }
        } 
      }
    );

    // Create bet result
    const betResult = {
      betId: betId,
      clientId: bet.clientId,
      won,
      profit: won ? 1 : -1,
      initialPrice: bet.priceAtBet,
      finalPrice,
      timestamp: new Date()
    };

    const resultsCollection = await getCollection('betResults');
    await resultsCollection.insertOne(betResult);

    return betResult;
  }

  return null;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    
    const betId = event.pathParameters?.betId;
    if (!betId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing betId' })
      };
    }

    // Check if we've already processed this bet
    if (processedBets.has(betId)) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'completed',
          result: null
        })
      };
    }

    // Get bet details
    const objectId = new ObjectId(betId);
    const betsCollection = await getCollection('bets');
    const bet = await betsCollection.findOne({ _id: objectId });

    if (!bet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Bet not found' })
      };
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

    // Check if bet should be completed
    const result = await checkBetStatus(betId);
    
    if (result) {
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

    // Return active status if bet is not ready to be completed
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