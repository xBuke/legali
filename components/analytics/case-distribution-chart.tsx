'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CaseDistributionData {
  status: string;
  count: number;
  percentage: number;
}

interface CaseDistributionChartProps {
  className?: string;
}

export function CaseDistributionChart({ className }: CaseDistributionChartProps) {
  const [data, setData] = useState<CaseDistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaseDistributionData();
  }, []);

  const loadCaseDistributionData = async () => {
    try {
      const response = await fetch('/api/analytics/case-distribution');
      if (response.ok) {
        const distributionData = await response.json();
        setData(distributionData);
      }
    } catch (error) {
      console.error('Error loading case distribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-muted-foreground">Učitavanje grafikona...</div>
      </div>
    );
  }

  const statusColors = {
    'OPEN': '#3B82F6',      // Blue
    'IN_PROGRESS': '#F59E0B', // Amber
    'CLOSED': '#10B981',    // Green
    'ON_HOLD': '#6B7280',   // Gray
    'CANCELLED': '#EF4444', // Red
  };

  const statusLabels = {
    'OPEN': 'Otvoreni',
    'IN_PROGRESS': 'U tijeku',
    'CLOSED': 'Zatvoreni',
    'ON_HOLD': 'Na čekanju',
    'CANCELLED': 'Otkazani',
  };

  const chartData = {
    labels: data.map(item => statusLabels[item.status as keyof typeof statusLabels] || item.status),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => statusColors[item.status as keyof typeof statusColors] || '#6B7280'),
        borderColor: data.map(item => statusColors[item.status as keyof typeof statusColors] || '#6B7280'),
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = data[context.dataIndex];
            return `${context.label}: ${item.count} (${item.percentage.toFixed(1)}%)`;
          },
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className={`h-64 ${className}`}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
