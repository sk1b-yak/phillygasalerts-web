import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';

const COLORS = {
  low: '#26a69a',    // Green - Low
  avg: '#2962FF',    // Blue - Average
  high: '#ef5350',   // Red - High
};

export default function PriceChart3Line({ data, theme = 'dark' }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef({});

  useEffect(() => {
    if (!chartRef.current) return;

    const isDark = theme === 'dark';

    // Create chart
    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1a1a2e' : '#ffffff' },
        textColor: isDark ? '#e0e0e0' : '#333333',
      },
      grid: {
        vertLines: { color: isDark ? '#333333' : '#cccccc' },
        horzLines: { color: isDark ? '#333333' : '#cccccc' },
      },
      timeScale: {
        borderColor: isDark ? '#475569' : '#cbd5e1',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: isDark ? '#475569' : '#cbd5e1',
      },
      crosshair: {
        mode: 1,
      },
    });

    chartInstanceRef.current = chart;

    // Add 3 line series
    seriesRef.current.low = chart.addSeries(LineSeries, {
      color: COLORS.low,
      lineWidth: 2,
      title: 'Low',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    seriesRef.current.avg = chart.addSeries(LineSeries, {
      color: COLORS.avg,
      lineWidth: 2,
      title: 'Avg',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    seriesRef.current.high = chart.addSeries(LineSeries, {
      color: COLORS.high,
      lineWidth: 2,
      title: 'High',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    // Resize handler using ResizeObserver
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0 && chartInstanceRef.current) {
          chartInstanceRef.current.applyOptions({ width });
        }
      }
    });

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      observer.disconnect();
      chartInstanceRef.current?.remove();
      chartInstanceRef.current = null;
      seriesRef.current = {};
    };
  }, [theme]);

  useEffect(() => {
    if (!data || !chartInstanceRef.current) return;

    // Update chart with data
    // data format: [{ time, min_price, avg_price, max_price }, ...]
    const lowData = data
      .filter((d) => d.time != null && d.min_price != null && !isNaN(d.min_price))
      .map((d) => ({
        time: typeof d.time === 'number' ? d.time : new Date(d.time).getTime() / 1000,
        value: Number(d.min_price),
      }))
      .sort((a, b) => a.time - b.time);

    const avgData = data
      .filter((d) => d.time != null && d.avg_price != null && !isNaN(d.avg_price))
      .map((d) => ({
        time: typeof d.time === 'number' ? d.time : new Date(d.time).getTime() / 1000,
        value: Number(d.avg_price),
      }))
      .sort((a, b) => a.time - b.time);

    const highData = data
      .filter((d) => d.time != null && d.max_price != null && !isNaN(d.max_price))
      .map((d) => ({
        time: typeof d.time === 'number' ? d.time : new Date(d.time).getTime() / 1000,
        value: Number(d.max_price),
      }))
      .sort((a, b) => a.time - b.time);

    seriesRef.current.low?.setData(lowData);
    seriesRef.current.avg?.setData(avgData);
    seriesRef.current.high?.setData(highData);

    chartInstanceRef.current.timeScale().fitContent();
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
