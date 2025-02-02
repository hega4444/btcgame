import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Context, APIGatewayProxyResult, APIGatewayProxyEvent, EventBridgeEvent } from 'aws-lambda';
import { ensureIndexes, closeConnection } from './shared/db';
import { startWebSocket } from './functions/update-prices/websocket';

// Load environment variables before importing handlers
dotenv.config();
process.env.NODE_ENV = 'development';

// Update imports to use require
const updatePricesHandler = require('./functions/update-prices').handler;
const getPricesHandler = require('./functions/prices').handler;
const placeBetHandler = require('./functions/place-bet').handler;
const getBetStatusHandler = require('./functions/get-bet-status').handler;
const getLeaderboardHandler = require('./functions/get-leaderboard').handler;
const getUserStatsHandler = require('./functions/get-user-stats').handler;
const forgetUserHandler = require('./functions/forget-user').handler;
const registerUserHandler = require('./functions/register-user').handler;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mock Lambda context
const mockContext: Context = {
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

// Mock EventBridge event for scheduled tasks
const mockScheduledEvent: EventBridgeEvent<'Scheduled Event', any> = {
  version: '0',
  id: 'mock-id',
  'detail-type': 'Scheduled Event',
  source: 'aws.events',
  account: 'mock-account',
  time: new Date().toISOString(),
  region: 'mock-region',
  resources: ['mock-resource'],
  detail: {}
};

// Create base API Gateway event
const createAPIGatewayEvent = (partial: Partial<APIGatewayProxyEvent>): APIGatewayProxyEvent => ({
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'GET',
  isBase64Encoded: false,
  path: '',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: '',
    apiId: '',
    authorizer: null,
    protocol: 'HTTP/1.1',
    httpMethod: 'GET',
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: '',
      user: null,
      userAgent: null,
      userArn: null,
    },
    path: '',
    stage: '',
    requestId: '',
    requestTimeEpoch: 0,
    resourceId: '',
    resourcePath: '',
  },
  resource: '',
  ...partial
});

// Setup price update interval
const startPriceUpdates = () => {
  // Initial update
  updatePricesHandler(
    mockScheduledEvent,
    mockContext,
    () => {}
  );

  // Schedule updates every 15 seconds
  setInterval(() => {
    updatePricesHandler(
      mockScheduledEvent,
      mockContext,
      () => {}
    );
  }, 15000);
};

// API Routes
app.get('/api/bitcoin/prices/:currency', async (req, res) => {
  const result = await getPricesHandler(
    createAPIGatewayEvent({
      pathParameters: { currency: req.params.currency }
    }),
    mockContext,
    () => {}
  ) as APIGatewayProxyResult;
  
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/api/place-bet', async (req, res) => {
  const result = await placeBetHandler(
    createAPIGatewayEvent({
      body: JSON.stringify(req.body),
      httpMethod: 'POST'
    }),
    mockContext,
    () => {}
  ) as APIGatewayProxyResult;
  
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.get('/api/bet/:betId', async (req, res) => {
  const result = await getBetStatusHandler(
    createAPIGatewayEvent({
      pathParameters: { betId: req.params.betId }
    }),
    mockContext,
    () => {}
  ) as APIGatewayProxyResult;
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.get('/api/leaderboard', async (req, res) => {
  const result = await getLeaderboardHandler(
    createAPIGatewayEvent({}),
    mockContext,
    () => {}
  ) as APIGatewayProxyResult;
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.get('/api/user/:userId/stats', async (req, res) => {
  const result = await getUserStatsHandler(
    createAPIGatewayEvent({
      pathParameters: { userId: req.params.userId }
    }),
    mockContext,
    () => {}
  ) as APIGatewayProxyResult;
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.delete('/api/user/:userId', async (req, res) => {
  const result = await forgetUserHandler(
    createAPIGatewayEvent({
      pathParameters: { userId: req.params.userId },
      httpMethod: 'DELETE'
    }),
    mockContext,
    () => {}
  ) as APIGatewayProxyResult;
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/api/register-user', async (req, res) => {
  const result = await registerUserHandler(
    createAPIGatewayEvent({
      body: JSON.stringify(req.body),
      httpMethod: 'POST'
    }),
    mockContext,
    () => {}
  ) as APIGatewayProxyResult;
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// Start server and price updates
app.listen(port, async () => {
  try {
    await ensureIndexes();
    console.log(`Development server running on port ${port}`);
    startPriceUpdates();  // Back to scheduled updates
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Add cleanup on server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await closeConnection();
  process.exit();
}); 