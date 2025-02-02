import React from 'react';
import { Line } from 'react-chartjs-2';
import { BitcoinPrice } from '../styles';
import { chartData, chartOptions } from '../config/chartConfig';

interface GameBoardProps {
  prices: Array<{timestamp: string; price: number}>;
  gameStarted: boolean;
  currency: string;
  isMobile: boolean;
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

export const GameBoard: React.FC<GameBoardProps> = ({
  prices,
  gameStarted,
  currency,
  isMobile
}) => {
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
        top: isMobile ? '20px' : '-10px',
        right: isMobile ? '10px' : '20px',
        zIndex: 2,
        opacity: gameStarted ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        <span>BTC:</span>
        {prices.length > 0 ? formatCurrency(prices[prices.length - 1].price, currency) : '-'}
      </BitcoinPrice>
      <Line data={chartData(prices) as any} options={chartOptions as any} />
    </div>
  );
}; 