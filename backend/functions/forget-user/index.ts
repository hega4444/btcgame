import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId' })
      };
    }

    const db = await getCollection('users');
    
    // Start a session for transaction
    const session = db.client.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete user profile
        await db.deleteOne({ userId });

        // Delete user's bets
        const betsCollection = await getCollection('bets');
        await betsCollection.deleteMany({ userId });

        // Delete bet results
        const resultsCollection = await getCollection('betResults');
        await resultsCollection.deleteMany({ userId });
      });

      await session.endSession();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'User data deleted successfully',
          userId
        })
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete user data' })
    };
  }
}; 