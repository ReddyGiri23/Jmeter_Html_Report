import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

interface HeatmapChartProps {
  data: Array<{ timestamp: number; transaction: string; responseTime: number }>;
  title?: string;
}

const HeatmapChart = ({ data, title = 'Response Time Heatmap' }: HeatmapChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const transactions = Array.from(new Set(data.map(d => d.transaction))).sort();
    const timestamps = Array.from(new Set(data.map(d => d.timestamp))).sort();

    const timeIntervals = 20;
    const timeStep = Math.max(1, Math.floor(timestamps.length / timeIntervals));
    const sampledTimestamps = timestamps.filter((_, i) => i % timeStep === 0);

    const heatmapData: number[][] = [];

    transactions.forEach(transaction => {
      const row: number[] = [];
      sampledTimestamps.forEach(timestamp => {
        const windowSize = timeStep * (timestamps[1] - timestamps[0]);
        const pointsInWindow = data.filter(
          d => d.transaction === transaction &&
               d.timestamp >= timestamp &&
               d.timestamp < timestamp + windowSize
        );

        const avgRT = pointsInWindow.length > 0
          ? pointsInWindow.reduce((sum, p) => sum + p.responseTime, 0) / pointsInWindow.length
          : 0;

        row.push(avgRT);
      });
      heatmapData.push(row);
    });

    const maxRT = Math.max(...heatmapData.flat().filter(v => v > 0));
    const minRT = Math.min(...heatmapData.flat().filter(v => v > 0));

    const getColor = (value: number): string => {
      if (value === 0) return 'rgba(200, 200, 200, 0.3)';
      const normalized = (value - minRT) / (maxRT - minRT);
      const r = Math.floor(255 * normalized);
      const g = Math.floor(255 * (1 - normalized));
      const b = 50;
      return `rgba(${r}, ${g}, ${b}, 0.8)`;
    };

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const cellWidth = canvasRef.current.width / sampledTimestamps.length;
    const cellHeight = canvasRef.current.height / transactions.length;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    heatmapData.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        ctx.fillStyle = getColor(value);
        ctx.fillRect(
          colIndex * cellWidth,
          rowIndex * cellHeight,
          cellWidth,
          cellHeight
        );

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(
          colIndex * cellWidth,
          rowIndex * cellHeight,
          cellWidth,
          cellHeight
        );
      });
    });

    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    transactions.forEach((transaction, index) => {
      const y = index * cellHeight + cellHeight / 2 + 3;
      ctx.fillText(transaction.substring(0, 20), 5, y);
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="relative" style={{ height: '400px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full"
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'rgba(50, 255, 50, 0.8)' }}></div>
          <span>Fast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'rgba(255, 255, 50, 0.8)' }}></div>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'rgba(255, 50, 50, 0.8)' }}></div>
          <span>Slow</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapChart;
