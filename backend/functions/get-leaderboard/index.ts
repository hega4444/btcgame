/**
 * Leaderboard Handler
 * 
 * Retrieves and formats the global leaderboard data.
 * Ranks players by score and provides player count.
 * 
 * Features:
 * - Top player ranking
 * - Score sorting
 * - Total player count
 * - Last update timestamp
 * 
 * Response:
 * - leaderboard: Array of top players with scores
 * - totalPlayers: Total number of registered players
 * - lastUpdated: Timestamp of last update
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const usersCollection = await getCollection('users');

    // Get top 10 users by score
    const leaderboard = await usersCollection
      .find({})
      .sort({ score: -1 })
      .limit(10)
      .toArray();

    // Map to the expected format
    const formattedLeaderboard = leaderboard.map(user => ({
      username: user.username,
      score: user.score
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        leaderboard: formattedLeaderboard,
        totalPlayers: await usersCollection.countDocuments(),
        lastUpdated: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get leaderboard' })
    };
  }
}; 