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

    // Return just what we need
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        username: user.username,
        score: user.score
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