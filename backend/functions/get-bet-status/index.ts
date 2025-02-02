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

    // Convert string ID to ObjectId and get bet details
    const objectId = new ObjectId(betId);
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
    
    // Log user lookup in one line
    console.log(`👤 User lookup: ${user?.username || 'Unknown'} (${bet.userId})`);

    const username = user?.username || 'Unknown User';

    // If bet is still active, check if it should be completed
    if (bet.status === 'active') {
      const now = new Date();
      const betTime = new Date(bet.timestamp);
      const betAge = now.getTime() - betTime.getTime();
      
      // Only complete the bet if enough time has passed
      if (betAge >= BET_DURATION) {
        try {
          let won: boolean;
          let finalPrice: number;

          // Determine win/loss - either forced or real
          if (FORCE_ALTERNATE) {
            lastWasWin = !lastWasWin;
            processedBets.add(betId);
            won = lastWasWin;
            finalPrice = won ? bet.priceAtBet + 1000 : bet.priceAtBet - 1000;
            console.log(`🎮 DEV MODE: Forcing ${won ? 'WIN' : 'LOSE'} result for bet ${betId}`);
          } else {
            // Get real price and determine result
            const pricesCollection = await getCollection('prices');
            const currentPrice = await pricesCollection
              .find({ currency: bet.currency.toLowerCase() })
              .sort({ timestamp: -1 })
              .limit(1)
              .toArray();

            if (!currentPrice.length) {
              throw new Error('No current price available');
            }

            finalPrice = currentPrice[0].price;
            const priceChange = finalPrice - bet.priceAtBet;
            won = (bet.betType === 'up' && priceChange > 0) || 
                  (bet.betType === 'down' && priceChange < 0);
          }

          // Update bet status
          await betsCollection.updateOne(
            { _id: objectId },
            { $set: { status: 'completed' } }
          );

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

          // Format prices for logging
          const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: bet.currency.toUpperCase()
          }).format(price);

          console.log(`📊 Stats update for ${username}: ${won ? 'Won' : 'Lost'}`);
          console.log(`   Initial price: ${formatPrice(bet.priceAtBet)}`);
          console.log(`   Final price:   ${formatPrice(finalPrice)}`);
          console.log(`   Score change:  ${won ? '+1' : '-1'}`);

          // Update user stats with better error handling
          const userUpdateResult = await usersCollection.updateOne(
            { clientId: bet.userId },
            { 
              $inc: { 
                wins: won ? 1 : 0,
                losses: won ? 0 : 1,
                score: won ? betResult.profit : Math.max(-(user?.score || 0), betResult.profit)
              },
              $set: { lastUpdated: new Date() }
            }
          );

          if (userUpdateResult.matchedCount === 0) {
            console.error(`❌ Failed to update stats: No user found with clientId ${bet.userId}`);
          } else {
            // Format prices for single line log
            const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: bet.currency.toUpperCase()
            }).format(price);
            
            console.log(`📊 Stats update for ${username}: ${won ? 'Won' : 'Lost'} (score: ${won ? '+1' : '-1'}) | ${formatPrice(bet.priceAtBet)} → ${formatPrice(finalPrice)}`);
          }

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