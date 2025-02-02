const generateMockPrices = () => {
  const now = new Date();
  const prices = [];
  const basePrice = 45000;
  
  for (let i = 11; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000); // Going back in 1-minute intervals
    prices.push({
      timestamp: time.toISOString(),
      price: basePrice + Math.random() * 1000 - 500 // Random price fluctuation
    });
  }
  
  return prices;
};

export const mockPrices = generateMockPrices(); 