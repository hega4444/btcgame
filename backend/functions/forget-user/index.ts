import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { MongoClient } from 'mongodb';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    const usersCollection = await getCollection('users');
    const betsCollection = await getCollection('bets');
    const resultsCollection = await getCollection('betResults');

    // Get MongoDB client from the collection's parent
    const client = (usersCollection as any).s.db.client as MongoClient;
    const session = client.startSession();

    try {
      // Start transaction
      session.startTransaction();

      // Delete user data
      await usersCollection.deleteOne({ clientId: userId }, { session });
      await betsCollection.deleteMany({ userId }, { session });
      await resultsCollection.deleteMany({ userId }, { session });

      // Commit transaction
      await session.commitTransaction();

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
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End session
      await session.endSession();
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete user data' })
    };
  }
}; 