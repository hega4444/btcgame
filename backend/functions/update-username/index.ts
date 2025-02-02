import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { UserProfile } from '../../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    const { username } = JSON.parse(event.body || '{}');

    if (!userId || !username) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId or username' })
      };
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Username must be between 3 and 20 characters' 
        })
      };
    }

    // Check if username is already taken by another user
    const usersCollection = await getCollection('users');
    const existingUser = await usersCollection.findOne({ 
      username,
      userId: { $ne: userId } // Exclude current user
    });

    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Username already taken' })
      };
    }

    // Update or create user profile
    const now = new Date();
    const updateResult = await usersCollection.updateOne(
      { userId },
      { 
        $set: {
          username,
          lastUpdated: now
        },
        $setOnInsert: {
          userId,
          createdAt: now
        }
      },
      { upsert: true }
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Username updated successfully',
        userId,
        username
      })
    };

  } catch (error) {
    console.error('Error updating username:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update username' })
    };
  }
}; 