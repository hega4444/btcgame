import express from 'express';
import cors from 'cors';
import { handler as updatePricesHandler } from './functions/update-prices';
import { handler as getPricesHandler } from './functions/prices';
import { handler as placeBetHandler } from './functions/place-bet';
import { handler as getBetStatusHandler } from './functions/get-bet-status';
import { handler as getLeaderboardHandler } from './functions/get-leaderboard';
import { handler as updateUsernameHandler } from './functions/update-username';
import { handler as getUserStatsHandler } from './functions/get-user-stats';
import { handler as forgetUserHandler } from './functions/forget-user';
import { handler as registerUserHandler } from './functions/register-user';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Setup price update interval
const startPriceUpdates = () => {
  // Initial update
  updatePricesHandler();

  // Schedule updates every 15 seconds
  setInterval(() => {
    updatePricesHandler();
  }, 15000);
};

// API Routes
app.get('/api/bitcoin/prices/:currency', async (req, res) => {
  const result = await getPricesHandler({
    pathParameters: { currency: req.params.currency }
  } as any);
  
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/api/place-bet', async (req, res) => {
  const result = await placeBetHandler({
    body: JSON.stringify(req.body)
  } as any);
  
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.get('/api/bet/:betId', async (req, res) => {
  const result = await getBetStatusHandler({
    pathParameters: { betId: req.params.betId }
  } as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.get('/api/leaderboard', async (req, res) => {
  const result = await getLeaderboardHandler({} as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.put('/api/user/:userId/username', async (req, res) => {
  const result = await updateUsernameHandler({
    pathParameters: { userId: req.params.userId },
    body: JSON.stringify(req.body)
  } as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.get('/api/user/:userId/stats', async (req, res) => {
  const result = await getUserStatsHandler({
    pathParameters: { userId: req.params.userId }
  } as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.delete('/api/user/:userId', async (req, res) => {
  const result = await forgetUserHandler({
    pathParameters: { userId: req.params.userId }
  } as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/api/register-user', async (req, res) => {
  const result = await registerUserHandler({
    body: JSON.stringify(req.body)
  } as any);
  res.status(result.statusCode).json(JSON.parse(result.body));
});

// Start server and price updates
app.listen(port, () => {
  console.log(`Development server running on port ${port}`);
  startPriceUpdates();
}); 