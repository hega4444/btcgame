import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Import handlers
import { handler as getPricesHandler } from '../functions/prices';
import { handler as placeBetHandler } from '../functions/place-bet';
import { handler as getBetStatusHandler } from '../functions/get-bet-status';
import { handler as getLeaderboardHandler } from '../functions/get-leaderboard';
import { handler as getUserStatsHandler } from '../functions/get-user-stats';
import { handler as forgetUserHandler } from '../functions/forget-user';
import { handler as registerUserHandler } from '../functions/register-user';

// Load environment variables
dotenv.config();

// Create Express app for testing
const app = express();
app.use(cors());
app.use(express.json());

// Mock context for Lambda functions
const mockContext = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: '',
  functionVersion: '',
  invokedFunctionArn: '',
  memoryLimitInMB: '',
  awsRequestId: '',
  logGroupName: '',
  logStreamName: '',
  getRemainingTimeInMillis: () => 0,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

// Setup test routes
app.get('/api/bitcoin/prices/:currency', async (req, res) => {
  const result = await getPricesHandler(
    {
      pathParameters: { currency: req.params.currency },
      httpMethod: 'GET',
    } as any,
    mockContext,
    () => {}
  );
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/api/place-bet', async (req, res) => {
  const result = await placeBetHandler(
    {
      body: JSON.stringify(req.body),
      httpMethod: 'POST',
    } as any,
    mockContext,
    () => {}
  );
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// Add other routes similarly...

describe('Backend API Endpoints', () => {
  let mongoClient: MongoClient;

  beforeAll(async () => {
    // Connect to test database
    mongoClient = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/btc-game-test');
  });

  afterAll(async () => {
    // Cleanup
    await mongoClient.close();
  });

  beforeEach(async () => {
    // Clear test database collections before each test
    const db = mongoClient.db();
    await Promise.all([
      db.collection('prices').deleteMany({}),
      db.collection('users').deleteMany({}),
      db.collection('bets').deleteMany({}),
      db.collection('betResults').deleteMany({})
    ]);
  });

  describe('GET /api/bitcoin/prices/:currency', () => {
    it('should return prices for valid currency', async () => {
      const response = await request(app)
        .get('/api/bitcoin/prices/usd')
        .expect(200);

      expect(response.body).toHaveProperty('currency', 'usd');
      expect(response.body).toHaveProperty('prices');
      expect(Array.isArray(response.body.prices)).toBe(true);
    });

    it('should handle invalid currency', async () => {
      await request(app)
        .get('/api/bitcoin/prices/invalid')
        .expect(400);
    });
  });

  describe('POST /api/place-bet', () => {
    it('should place a valid bet', async () => {
      const testBet = {
        userId: 'test-user',
        currency: 'usd',
        betType: 'up'
      };

      const response = await request(app)
        .post('/api/place-bet')
        .send(testBet)
        .expect(200);

      expect(response.body).toHaveProperty('betId');
      expect(response.body).toHaveProperty('priceAtBet');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should reject invalid bet data', async () => {
      const invalidBet = {
        userId: 'test-user',
        // Missing required fields
      };

      await request(app)
        .post('/api/place-bet')
        .send(invalidBet)
        .expect(400);
    });
  });

  describe('POST /api/register-user', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        clientId: 'test-client-id'
      };

      const response = await request(app)
        .post('/api/register-user')
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('clientId', 'test-client-id');
    });

    it('should reject duplicate username', async () => {
      const userData = {
        username: 'testuser',
        clientId: 'test-client-id'
      };

      // Register first user
      await request(app)
        .post('/api/register-user')
        .send(userData)
        .expect(200);

      // Try to register same username again
      await request(app)
        .post('/api/register-user')
        .send({
          ...userData,
          clientId: 'different-client-id'
        })
        .expect(409);
    });
  });

  describe('GET /api/leaderboard', () => {
    it('should return leaderboard data', async () => {
      const response = await request(app)
        .get('/api/leaderboard')
        .expect(200);

      expect(response.body).toHaveProperty('leaderboard');
      expect(response.body).toHaveProperty('totalPlayers');
      expect(Array.isArray(response.body.leaderboard)).toBe(true);
    });
  });

  // Add more test cases for other endpoints...
}); 