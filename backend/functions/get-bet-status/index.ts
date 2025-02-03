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
  try {
    let cleanBetId = betId.trim();
    if (!ObjectId.isValid(cleanBetId)) {
      return null;
    }

    const objectId = new ObjectId(cleanBetId);
    const betsCollection = await getCollection('bets');
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
      
      // Use FORCE_ALTERNATE if enabled, otherwise use real price comparison
      let won;
      if (FORCE_ALTERNATE) {
        won = !lastWasWin; // Alternate between win/lose
        lastWasWin = won;  // Update for next bet
      } else {
        won = (bet.betType === 'up' && priceChange > 0) || 
              (bet.betType === 'down' && priceChange < 0);
      }

      console.log(`🎲 Bet Result: ${bet.betType.toUpperCase()} ${won ? '✅' : '❌'} | Initial: $${bet.priceAtBet.toFixed(2)} → Final: $${finalPrice.toFixed(2)} | Change: ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)} ${FORCE_ALTERNATE ? '(Forced Alternate)' : ''}`);

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

      // Update user statistics
      const usersCollection = await getCollection('users');
      
      // Don't try to convert clientId to ObjectId, use it directly
      const user = await usersCollection.findOne({ clientId: bet.clientId });
      const currentScore = user?.score || 0;
      
      await usersCollection.updateOne(
        { clientId: bet.clientId }, // Use clientId directly
        {
          $inc: { 
            totalBets: 1,
            wins: won ? 1 : 0,
            losses: won ? 0 : 1,
            score: won ? 1 : (currentScore > 0 ? -1 : 0)
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
  } catch (error) {
    console.error('Error in checkBetStatus:', error);
    return null;
  }
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    
    const betId = event.pathParameters?.betId;
    if (!betId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Missing betId',
          status: 'completed',
          result: null
        })
      };
    }

    // Validate betId format and try to clean it
    let cleanBetId = betId.trim();
    if (cleanBetId.length !== 24) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: `Invalid betId length: ${cleanBetId.length}`,
          status: 'completed',
          result: null
        })
      };
    }

    // Additional validation for hex format
    if (!/^[0-9a-fA-F]{24}$/.test(cleanBetId)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid betId format (not hex)',
          status: 'completed',
          result: null
        })
      };
    }

    // Try to create ObjectId
    let objectId;
    try {
      objectId = new ObjectId(cleanBetId);
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid betId format',
          status: 'completed',
          result: null
        })
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
    const result = await checkBetStatus(cleanBetId);
    
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