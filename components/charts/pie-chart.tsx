'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'

interface PieChartProps {
  data: any[]
  config: ChartConfig
  className?: string
  height?: number
  showLegend?: boolean
}

export function CustomPieChart({ data, config, className, height = 300, showLegend = true }: PieChartProps) {
  const colors = Object.keys(config).map((key) => `hsl(var(--color-${key}))`)
  
  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
