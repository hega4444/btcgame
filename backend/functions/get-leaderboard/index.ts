import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const usersCollection = await getCollection('users');
    const resultsCollection = await getCollection('betResults');

    // Get all users
    const users = await usersCollection.find().toArray();

    // Get all bet results
    const allResults = await resultsCollection.find().toArray();

    // Calculate stats for each user
    const userStats = await Promise.all(users.map(async user => {
      const userResults = allResults.filter(r => r.userId === user.clientId);
      const wins = userResults.filter(r => r.won).length;
      const totalBets = userResults.length;
      const totalProfit = userResults.reduce((sum, r) => sum + r.profit, 0);
      const winRate = totalBets > 0 ? (wins / totalBets * 100) : 0;

      return {
        username: user.username,
        clientId: user.clientId,
        wins,
        totalBets,
        winRate: Math.round(winRate * 100) / 100,
        totalProfit,
        lastBet: userResults.length > 0 
          ? Math.max(...userResults.map(r => r.timestamp.getTime()))
          : user.createdAt.getTime()
      };
    }));

    // Sort users by profit, then win rate, then most recent activity
    const sortedStats = userStats.sort((a, b) => {
      if (b.totalProfit !== a.totalProfit) {
        return b.totalProfit - a.totalProfit;
      }
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      return b.lastBet - a.lastBet;
    });

    // Take top 10 users
    const leaderboard = sortedStats.slice(0, 10);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        leaderboard,
        totalPlayers: users.length,
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