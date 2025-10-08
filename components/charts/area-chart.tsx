'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface AreaChartProps {
  data: Record<string, unknown>[]
  config: ChartConfig
  className?: string
  height?: number
}

export function CustomAreaChart({ data, config, className, height = 300 }: AreaChartProps) {
  return (
    <ChartContainer config={config} className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          {Object.keys(config).map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`hsl(var(--color-${key}))`}
              fill={`hsl(var(--color-${key}))`}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
