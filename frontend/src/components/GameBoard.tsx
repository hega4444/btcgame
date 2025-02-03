import * as React from 'react';
import { Line } from 'react-chartjs-2';
import { BitcoinPrice } from '../styles';
import { chartData, chartOptions } from '../config/chartConfig';
import { Chart as ChartJS } from 'chart.js';

interface GameBoardProps {
  prices: Array<{timestamp: string; price: number}>;
  gameStarted: boolean;
  currency: string;
  isMobile: boolean;
  betPrice?: number | null;
}

const formatCurrency = (amount: number, currencyCode: string) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
};

/**
 * Game Board Component
 * 
 * Renders the main game interface including the price chart.
 * Manages the visual representation of Bitcoin price movements.
 * 
 * Features:
 * - Real-time price chart
 * - Current price display
 * - Responsive layout
 * - Betting price indicators
 * 
 * Props:
 * - prices: Array of price data points
 * - gameStarted: Game state flag
 * - currency: Selected currency
 * - isMobile: Responsive layout flag
 * - betPrice: Current bet price marker
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  prices,
  gameStarted,
  currency,
  isMobile,
  betPrice
}) => {
  // Add cleanup on unmount to prevent canvas reuse error
  React.useEffect(() => {
    return () => {
      const charts = ChartJS.instances;
      Object.keys(charts).forEach(key => {
        charts[key].destroy();
      });
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: isMobile ? '98%' : '90%',
      height: '80vh',
      maxHeight: '600px',
      borderRadius: '10px',
      padding: isMobile ? '5px' : '20px',
      zIndex: 1,
      opacity: gameStarted ? 1 : 0.3,
      transition: 'opacity 0.5s ease',
    }}>
      <BitcoinPrice style={{
        position: 'absolute',
        top: isMobile ? '30px' : '10px',
        right: '10px',
        zIndex: 2,
        opacity: gameStarted ? 1 : 0,
        transition: 'opacity 0.5s ease',
        fontSize: isMobile ? '10px' : '16px'
      }}>
        <span>BTC:</span>
        {prices.length > 0 ? formatCurrency(prices[prices.length - 1].price, currency) : '-'}
      </BitcoinPrice>
      <Line 
        data={chartData(prices, betPrice)}
        options={chartOptions}
        redraw={false}
      />
    </div>
  );
}; 