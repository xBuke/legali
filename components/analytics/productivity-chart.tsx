'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ProductivityData {
  user: string;
  casesCompleted: number;
  billableHours: number;
  revenue: number;
}

interface ProductivityChartProps {
  className?: string;
}

export function ProductivityChart({ className }: ProductivityChartProps) {
  const [data, setData] = useState<ProductivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductivityData();
  }, []);

  const loadProductivityData = async () => {
    try {
      const response = await fetch('/api/analytics/productivity');
      if (response.ok) {
        const productivityData = await response.json();
        setData(productivityData);
      }
    } catch (error) {
      console.error('Error loading productivity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-muted-foreground">Učitavanje grafikona...</div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => item.user),
    datasets: [
      {
        label: 'Završeni predmeti',
        data: data.map(item => item.casesCompleted),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Naplativo sati',
        data: data.map(item => item.billableHours),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            if (context.datasetIndex === 0) {
              const userData = data[context.dataIndex];
              return `Prihod: ${new Intl.NumberFormat('hr-HR', {
                style: 'currency',
                currency: 'EUR',
              }).format(userData.revenue)}`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Broj predmeta',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Sati',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className={`h-96 ${className}`}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
