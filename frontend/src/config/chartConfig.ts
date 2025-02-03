import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Add this helper function at the top of the file
const isCloseTo = (a: number, b: number | null | undefined, tolerance = 0.01) => {
  if (b === null || b === undefined) return false;
  return Math.abs(a - b) < tolerance;
};

export const chartData = (prices: Array<{timestamp: string; price: number}>, betPrice?: number | null) => ({
  labels: prices.map(p => new Date(p.timestamp).toLocaleTimeString()),
  datasets: [
    {
      label: 'Bitcoin Price',
      data: prices.map(p => p.price),
      borderColor: 'rgb(255, 255, 0)',
      backgroundColor: 'rgba(255, 255, 0, 0.1)',
      borderWidth: 4,
      tension: 0.4,
      fill: true,
      shadowBlur: 20,
      shadowColor: 'rgba(255, 255, 0, 0.6)',
      borderDash: [],
      pointBackgroundColor: prices.map(p => 
        isCloseTo(p.price, betPrice) ? 'rgba(255, 255, 255, 0.9)' : 'rgb(255, 255, 0)'
      ),
      pointBorderColor: prices.map(p => 
        isCloseTo(p.price, betPrice) ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 0, 0.9)'
      ),
      pointRadius: prices.map(p => 
        isCloseTo(p.price, betPrice) ? 8 : 5
      ),
      pointHoverBackgroundColor: 'rgb(255, 255, 0)',
      pointHoverBorderColor: 'rgba(255, 255, 0, 1)',
      pointHoverRadius: 8,
      borderCapStyle: 'round',
      borderJoinStyle: 'round',
    }
  ],
});

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      titleFont: {
        family: "'Press Start 2P', cursive",
        size: 10
      },
      bodyFont: {
        family: "'Press Start 2P', cursive",
        size: 10
      },
      padding: 10,
      animation: {
        duration: 200
      },
      callbacks: {
        label: function(context: any) {
          const value = context.raw;
          return `Price: ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value)}`;
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false,
      },
      ticks: {
        color: window.innerWidth < 768 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.9)',
        font: {
          family: "'Press Start 2P', cursive",
          size: window.innerWidth < 768 ? 8 : 10,
          weight: 'bold',
        },
        maxRotation: 45,
        minRotation: 45,
        padding: window.innerWidth < 768 ? 5 : 10,
        callback: function(value: any, index: number, ticks: any[]) {
          if (window.innerWidth < 768) {
            return index === 0 || index === ticks.length - 1 ? this.getLabelForValue(value) : '';
          }
          return index % 2 === 0 ? this.getLabelForValue(value) : '';
        },
      }
    },
    y: {
      display: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.15)',
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          family: "'Press Start 2P', cursive",
          size: 10,
          weight: 'bold',
        },
        padding: 15,
        callback: function(value: any, index: number, ticks: any[]) {
          return index % 2 === 0 ? value : '';
        },
      }
    }
  },
  elements: {
    line: {
      borderWidth: 4,
      borderColor: 'rgb(255, 255, 0)',
      backgroundColor: 'transparent',
      tension: 0.4,
      borderCapStyle: 'round',
      borderJoinStyle: 'round',
    },
    point: {
      radius: 5,
      borderWidth: 2,
      backgroundColor: 'rgb(255, 255, 0)',
      borderColor: 'rgba(255, 255, 0, 0.9)',
      hoverRadius: 8,
      hoverBorderWidth: 3
    }
  }
}; 