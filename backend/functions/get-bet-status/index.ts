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

    // Check if we should force alternate results
    if (FORCE_ALTERNATE) {
      // Toggle win/lose and mark bet as processed
      lastWasWin = !lastWasWin;
      processedBets.add(betId);
      
      const mockResult: BetResult = {
        betId: betId,
        userId: 'mock-user-id',
        won: lastWasWin,
        profit: lastWasWin ? 1 : -1,
        initialPrice: 40000,
        finalPrice: lastWasWin ? 41000 : 39000,
        timestamp: new Date()
      };

      console.log(`🎮 DEV MODE: Forcing ${lastWasWin ? 'WIN' : 'LOSE'} result for bet ${betId}`);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'completed',
          result: mockResult
        })
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

    // Get username for logging
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ clientId: bet.userId });
    const username = user?.username || 'Unknown User';

    // If bet is still active, check if it should be completed
    if (bet.status === 'active') {
      // Check if bet duration has elapsed
      const now = new Date();
      const betTime = new Date(bet.timestamp);
      const betAge = now.getTime() - betTime.getTime();
      
      // Only complete the bet if enough time has passed
      if (betAge >= BET_DURATION) {
        try {
          // Get current price
          const pricesCollection = await getCollection('prices');
          const currentPrice = await pricesCollection
            .find({ 
              currency: bet.currency.toLowerCase()
            })
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

          // Log the result in one line
          console.log(`🎯 Result [${bet._id}]: ${username}'s ${bet.betType.toUpperCase()} bet ${won ? '✨ WON ✨' : '❌ LOST ❌'} (${formatPrice(bet.priceAtBet)} → ${formatPrice(finalPrice)})`);

          // Update bet status FIRST - before creating result
          const updateResult = await betsCollection.updateOne(
            { _id: objectId },
            { $set: { status: 'completed' } }
          );

          if (updateResult.modifiedCount === 0) {
            throw new Error('Failed to update bet status');
          }

          console.log(`✅ Bet ${objectId} marked as completed`);

          // Create and save bet result
          const betResult: BetResult = {
            betId: objectId.toString(),
            userId: bet.userId,
            won,
            profit: won ? 1 : -1,
            initialPrice: bet.priceAtBet,
            finalPrice,
            timestamp: new Date()
          };

          const resultsCollection = await getCollection('betResults');
          await resultsCollection.insertOne(betResult);

          console.log(`💾 Bet result saved for ${objectId}`);
          console.log(`🎯 Final Result - Won: ${won}, Price Change: ${priceChange}`);

          // Update user stats
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
        } catch (error) {
          console.error('Error completing bet:', error);
          throw error;
        }
      } else {
        console.log('⏳ Bet is still within active duration');
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