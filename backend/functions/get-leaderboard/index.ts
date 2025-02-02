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