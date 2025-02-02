import { APIGatewayProxyHandler } from 'aws-lambda';
import { getCollection } from '../../shared/db';
import { UserProfile } from '../../shared/types';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { username, clientId } = JSON.parse(event.body || '{}');

    if (!username || !clientId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Username and clientId are required' })
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

    const usersCollection = await getCollection('users');

    // Check if username is already taken
    const existingUsername = await usersCollection.findOne({ username });
    if (existingUsername) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Username already taken' })
      };
    }

    // Check if clientId already exists
    const existingClient = await usersCollection.findOne({ clientId });
    if (existingClient) {
      // Update username for existing client
      await usersCollection.updateOne(
        { clientId },
        { 
          $set: { 
            username,
            lastUpdated: new Date()
          }
        }
      );

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

    // Create new user profile
    const userProfile: UserProfile = {
      clientId,
      username,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    await usersCollection.insertOne(userProfile);

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
    console.error('Error registering user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to register user' })
    };
  }
}; 