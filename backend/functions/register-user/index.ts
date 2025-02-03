import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { UserProfile } from '../../shared/types';

/**
 * User Registration Handler
 * 
 * Manages user registration and profile updates.
 * Handles username validation and duplicate checking.
 * 
 * Features:
 * - New user registration
 * - Username updates
 * - Duplicate username prevention
 * - User profile initialization
 * 
 * Request Body:
 * - username: User's display name
 * - clientId: Unique client identifier
 */

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { username, clientId } = JSON.parse(event.body || '{}');

    if (!username || !clientId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Username and clientId are required' })
      };
    }

    if (username.length < 3 || username.length > 20) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Username must be between 3 and 20 characters' 
        })
      };
    }

    const usersCollection = await getCollection('users');
    const existingUsername = await usersCollection.findOne({ username });

    if (existingUsername) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Username already taken' })
      };
    }

    const existingClient = await usersCollection.findOne({ clientId });

    if (existingClient) {
      const updateResult = await usersCollection.updateOne(
        { clientId },
        { 
          $set: { 
            username,
            lastUpdated: new Date()
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        throw new Error('Failed to update user record');
      }

      console.log(`✅ Updated username for ${clientId}: ${existingClient.username} → ${username}`);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Username updated successfully',
          username,
          clientId
        })
      };
    }

    const userProfile: UserProfile = {
      clientId,
      username,
      createdAt: new Date(),
      lastUpdated: new Date(),
      wins: 0,
      losses: 0,
      score: 0
    };

    await usersCollection.insertOne(userProfile);
    console.log(`✨ New user registered: ${username} (${clientId})`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        username,
        clientId
      })
    };

  } catch (error) {
    console.error('💥 Error registering user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to register user' })
    };
  }
}; 