from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime, timedelta
import time
from typing import List, Dict, Literal
import asyncio
from collections import deque
import logging
from pydantic import BaseModel
from operator import itemgetter

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update this with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a cache to store price history
price_cache: Dict[str, deque] = {}
CACHE_SIZE = 12

# New data structures for bets and results
class Bet(BaseModel):
    user_id: str
    currency: str
    bet_type: Literal["up", "down"]
    price_at_bet: float
    bet_amount: float
    timestamp: datetime = None

class BetResult(BaseModel):
    bet_id: str
    user_id: str
    won: bool
    profit: float
    initial_price: float
    final_price: float

# New caches
active_bets: Dict[str, Bet] = {}
bet_results: Dict[str, BetResult] = {}

# Add new data structure for user scores
class UserScore(BaseModel):
    user_id: str
    username: str
    wins: int
    losses: int

# Add new cache for user scores
user_scores: Dict[str, UserScore] = {}

async def fetch_bitcoin_price(currency: str = "usd") -> float:
    """Fetch current Bitcoin price from CoinGecko API"""
    try:
        url = f"https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "bitcoin",
            "vs_currencies": currency.lower()
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()["bitcoin"][currency.lower()]
    except Exception as e:
        logging.error(f"Error fetching Bitcoin price: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch Bitcoin price")

async def update_price_cache():
    """Background task to update price cache"""
    while True:
        try:
            for currency in ["usd", "eur", "gbp"]:  # Add more currencies as needed
                if currency not in price_cache:
                    price_cache[currency] = deque(maxlen=CACHE_SIZE)
                
                price = await fetch_bitcoin_price(currency)
                price_cache[currency].append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "price": price
                })
            
            # Wait for 15 seconds before next update
            # Note: Using 15 seconds to stay well within CoinGecko's rate limits
            await asyncio.sleep(15)
        except Exception as e:
            logging.error(f"Error in update task: {str(e)}")
            await asyncio.sleep(5)

async def update_user_score(bet_result: BetResult):
    """Update user's score based on bet result"""
    user_id = bet_result.user_id
    
    if user_id not in user_scores:
        # Initialize new user score if not exists
        user_scores[user_id] = UserScore(
            user_id=user_id,
            username=f"User_{user_id}",  # Default username
            wins=0,
            losses=0
        )
    
    user_score = user_scores[user_id]
    if bet_result.won:
        user_score.wins += 1
    else:
        user_score.losses += 1

async def check_bets():
    """Background task to check bet outcomes"""
    while True:
        try:
            current_time = datetime.utcnow()
            bets_to_check = {
                bet_id: bet for bet_id, bet in active_bets.items()
                if (current_time - bet.timestamp) >= timedelta(seconds=60)
            }
            
            for bet_id, bet in bets_to_check.items():
                # Get current price
                current_price = await fetch_bitcoin_price(bet.currency)
                
                # Determine if bet won
                price_increased = current_price > bet.price_at_bet
                won = (price_increased and bet.bet_type == "up") or \
                      (not price_increased and bet.bet_type == "down")
                
                # Calculate profit (simple 1:1 payout for demonstration)
                profit = bet.bet_amount if won else -bet.bet_amount
                
                # Store result
                result = BetResult(
                    bet_id=bet_id,
                    user_id=bet.user_id,
                    won=won,
                    profit=profit,
                    initial_price=bet.price_at_bet,
                    final_price=current_price
                )
                bet_results[bet_id] = result
                
                # Update user score
                await update_user_score(result)
                
                # Remove from active bets
                del active_bets[bet_id]
                
                logging.info(f"Bet {bet_id} processed: User {bet.user_id} {'won' if won else 'lost'}")
            
            await asyncio.sleep(5)
        except Exception as e:
            logging.error(f"Error in bet checking task: {str(e)}")
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    """Start the background tasks when the application starts"""
    asyncio.create_task(update_price_cache())
    asyncio.create_task(check_bets())

@app.get("/api/bitcoin/prices/{currency}")
async def get_bitcoin_prices(currency: str):
    """Get the last 12 Bitcoin prices for the specified currency"""
    currency = currency.lower()
    if currency not in price_cache:
        raise HTTPException(status_code=400, detail="Currency not supported")
    
    return {
        "currency": currency,
        "prices": list(price_cache[currency])
    }

@app.post("/api/place-bet")
async def place_bet(
    user_id: str,
    currency: str,
    bet_type: Literal["up", "down"],
    bet_amount: float
):
    """Place a new bet on Bitcoin price trend"""
    try:
        currency = currency.lower()
        if currency not in price_cache:
            raise HTTPException(status_code=400, detail="Currency not supported")
        
        current_price = await fetch_bitcoin_price(currency)
        
        # Create new bet
        bet = Bet(
            user_id=user_id,
            currency=currency,
            bet_type=bet_type,
            price_at_bet=current_price,
            bet_amount=bet_amount,
            timestamp=datetime.utcnow()
        )
        
        # Generate unique bet ID (simple implementation)
        bet_id = f"bet_{len(active_bets)}_{datetime.utcnow().timestamp()}"
        active_bets[bet_id] = bet
        
        return {
            "bet_id": bet_id,
            "message": "Bet placed successfully",
            "price_at_bet": current_price,
            "timestamp": bet.timestamp
        }
    except Exception as e:
        logging.error(f"Error placing bet: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to place bet")

@app.get("/api/bet/{bet_id}")
async def get_bet_status(bet_id: str):
    """Get the status of a specific bet"""
    # Check if bet is still active
    if bet_id in active_bets:
        bet = active_bets[bet_id]
        return {
            "status": "active",
            "bet_details": bet,
            "time_remaining": 60 - (datetime.utcnow() - bet.timestamp).seconds
        }
    
    # Check if bet has been processed
    if bet_id in bet_results:
        return {
            "status": "completed",
            "result": bet_results[bet_id]
        }
    
    raise HTTPException(status_code=404, detail="Bet not found")

@app.get("/api/user-bets/{user_id}")
async def get_user_bets(user_id: str):
    """Get all bets and results for a specific user"""
    active_user_bets = {
        bet_id: bet for bet_id, bet in active_bets.items()
        if bet.user_id == user_id
    }
    
    user_results = {
        bet_id: result for bet_id, result in bet_results.items()
        if result.user_id == user_id
    }
    
    return {
        "active_bets": active_user_bets,
        "completed_bets": user_results
    }

# Add new endpoints for leaderboard and username management
@app.get("/api/leaderboard")
async def get_leaderboard():
    """Get top 10 users by number of wins"""
    # Sort by wins only
    sorted_scores = sorted(
        user_scores.values(),
        key=lambda x: x.wins,
        reverse=True
    )
    
    # Return top 10 scores
    return {
        "leaderboard": sorted_scores[:10],
        "total_users": len(user_scores)
    }

@app.put("/api/user/{user_id}/username")
async def update_username(user_id: str, username: str):
    """Update username for a user"""
    if len(username) < 3 or len(username) > 20:
        raise HTTPException(
            status_code=400,
            detail="Username must be between 3 and 20 characters"
        )
    
    if user_id not in user_scores:
        user_scores[user_id] = UserScore(
            user_id=user_id,
            username=username,
            wins=0,
            losses=0
        )
    else:
        user_scores[user_id].username = username
    
    return {"message": "Username updated successfully"}

@app.get("/api/user/{user_id}/stats")
async def get_user_stats(user_id: str):
    """Get detailed stats for a specific user"""
    if user_id not in user_scores:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_score = user_scores[user_id]
    total_bets = user_score.wins + user_score.losses
    win_rate = (user_score.wins / total_bets * 100) if total_bets > 0 else 0
    
    return {
        "user_id": user_id,
        "username": user_score.username,
        "wins": user_score.wins,
        "losses": user_score.losses,
        "total_bets": total_bets,
        "win_rate": round(win_rate, 2),
        "rank": next(
            (i + 1 for i, score in enumerate(sorted(
                user_scores.values(),
                key=lambda x: x.wins,
                reverse=True
            )) if score.user_id == user_id),
            len(user_scores)
        )
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 