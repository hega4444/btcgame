import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { MongoClient } from 'mongodb';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const clientId = event.pathParameters?.clientId;

    if (!clientId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Client ID is required' })
      };
    }

    const usersCollection = await getCollection('users');
    const betsCollection = await getCollection('bets');
    const resultsCollection = await getCollection('betResults');

    const user = await usersCollection.findOne({ clientId });
    console.log('🗑️ Deleting user', user?.username);

    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Delete user data without transaction
    await usersCollection.deleteOne({ clientId });
    await betsCollection.deleteMany({ clientId });
    await resultsCollection.deleteMany({ clientId });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User data deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to delete user data' })
    };
  }
}; 