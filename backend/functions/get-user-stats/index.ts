import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const clientId = event.pathParameters?.userId;

    if (!clientId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing clientId' })
      };
    }

    // Get user profile
    const usersCollection = await getCollection('users');
    const user = await usersCollection.findOne({ clientId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Get user's bet results
    const resultsCollection = await getCollection('betResults');
    const results = await resultsCollection.find({ userId: clientId }).toArray();

    // Calculate stats
    const totalBets = results.length;
    const wins = results.filter(r => r.won).length;
    const losses = totalBets - wins;
    const winRate = totalBets > 0 ? (wins / totalBets * 100) : 0;
    const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);

    // Get user's rank
    const allUsers = await usersCollection.find().toArray();
    const userRanks = allUsers
      .map(u => ({
        clientId: u.clientId,
        totalProfit: results
          .filter(r => r.userId === u.clientId)
          .reduce((sum, r) => sum + r.profit, 0)
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit);

    const rank = userRanks.findIndex(u => u.clientId === clientId) + 1;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        username: user.username,
        totalBets,
        wins,
        losses,
        winRate: Math.round(winRate * 100) / 100,
        totalProfit,
        rank,
        totalPlayers: allUsers.length
      })
    };

  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get user stats' })
    };
  }
}; 