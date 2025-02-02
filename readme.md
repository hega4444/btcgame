# Bitcoin Price Prediction Game 🎮

A real-time Bitcoin price prediction game built with React, TypeScript, and AWS Serverless architecture. Players can bet on Bitcoin's price movement and compete for high scores on the global leaderboard.

![Game Screenshot](./cover.png)

## 🎯 Features

- Real-time Bitcoin price tracking across multiple currencies (USD, EUR, GBP)
- Live betting system with immediate feedback
- Global leaderboard
- Responsive design for mobile and desktop
- Sound effects and background music
- User profile management
- Secure data persistence

## 🏗️ Architecture

### Frontend
- React 18 with TypeScript
- Vite for fast development and optimized builds
- Styled Components for dynamic styling
- Chart.js for real-time price visualization
- WebSocket integration for live price updates

### Backend
- AWS Lambda Functions (Serverless)
- MongoDB Atlas for data persistence
- Express.js for local development
- WebSocket integration with Binance API
- Jest for testing

### AWS Services Used
- API Gateway for RESTful endpoints
- Lambda for serverless compute
- EventBridge for scheduled tasks
- CloudWatch for monitoring and logging
- SAM (Serverless Application Model) for infrastructure

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local instance for development)
- AWS CLI (for deployment)
- SAM CLI (for local Lambda testing)

### Local Development

1. Clone the repository:
~~~bash
git clone https://github.com/hega4444/bitcoin-game.git
cd bitcoin-game
~~~

2. Install dependencies:
~~~bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
~~~

3. Set up environment variables:

Frontend (.env.development):
~~~
VITE_API_URL=http://localhost:5000
VITE_USE_MOCK_DATA=false
~~~

Backend (.env):
~~~
MONGODB_URI=mongodb://localhost:27017/btc-game-dev
NODE_ENV=development
~~~

4. Start the development servers:
~~~bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
~~~

The game will be available at `http://localhost:5173`

## 🧪 Testing

### Backend Tests
~~~bash
cd backend
npm test
~~~

The backend uses Jest for testing API endpoints and business logic. Tests are located in `backend/__tests__/`.

Key test areas:
- API endpoint validation
- Bet placement and resolution
- User registration and authentication
- Price fetching and currency conversion
- Database operations

> **Testing Tip**: You can set `BET_TIMER_SECONDS=5` in your `.env` file to reduce the betting timer from 60 to 5 seconds during testing.

### Frontend Tests
~~~bash
cd frontend
npm test
~~~

## 📦 Deployment

### Backend Deployment (AWS)

1. Configure AWS credentials:
~~~bash
aws configure
~~~

2. Deploy using SAM:
~~~bash
cd backend
npm run deploy
~~~

This will deploy all Lambda functions and create the necessary AWS resources defined in `template.yaml`.

### Frontend Deployment

1. Build the production bundle:
~~~bash
cd frontend
npm run build
~~~

2. Deploy the `dist` folder to your preferred hosting service (e.g., AWS S3, Vercel, Netlify).

## 🔄 CI/CD

The project includes GitHub Actions workflows for:
- Automated testing
- Code quality checks
- AWS deployment
- Frontend deployment

## 📝 API Documentation

### Endpoints

- `GET /api/bitcoin/prices/:currency` - Get latest Bitcoin prices
- `POST /api/place-bet` - Place a new bet
- `GET /api/bet/:betId` - Check bet status
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/user/:userId/stats` - Get user statistics
- `POST /api/register-user` - Register new user
- `DELETE /api/user/:userId` - Delete user data

## 🛠️ Technical Considerations

- WebSocket connection for real-time price updates (with Binance API)
- Rate limiting on API endpoints
- CORS configuration for security
- Error handling and logging
- Database indexing for performance
- Cache management
- Responsive design breakpoints

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

Your Name
- GitHub: [@hega4444](https://github.com/yourusername)
