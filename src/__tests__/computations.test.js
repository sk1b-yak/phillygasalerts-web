import { describe, it, expect } from 'vitest'
import { sma, ema, stdDevBands, percentiles, trendLine, aggregateDaily, aggregateWeekly, minMaxBand } from '../utils/computations'

describe('computations', () => {
  describe('sma', () => {
    it('returns empty array for empty input', () => {
      expect(sma([], 3)).toEqual([])
    })

    it('returns null for period-1 entries', () => {
      const data = [
        { time: 1, value: 10 },
        { time: 2, value: 20 },
        { time: 3, value: 30 },
        { time: 4, value: 40 },
        { time: 5, value: 50 },
      ]
      const result = sma(data, 3)
      expect(result[0].value).toBeNull()
      expect(result[1].value).toBeNull()
      expect(result[2].value).toBe(20) // (10+20+30)/3
      expect(result[3].value).toBe(30) // (20+30+40)/3
      expect(result[4].value).toBe(40) // (30+40+50)/3
    })

    it('handles single element', () => {
      const result = sma([{ time: 1, value: 10 }], 3)
      expect(result[0].value).toBeNull()
    })

    it('preserves time field', () => {
      const data = [
        { time: '2024-01-01', value: 10 },
        { time: '2024-01-02', value: 20 },
        { time: '2024-01-03', value: 30 },
      ]
      const result = sma(data, 2)
      expect(result[0].time).toBe('2024-01-01')
      expect(result[1].time).toBe('2024-01-02')
      expect(result[2].time).toBe('2024-01-03')
    })
  })

  describe('ema', () => {
    it('returns empty array for empty input', () => {
      expect(ema([], 3)).toEqual([])
    })

    it('initializes with SMA of first period values', () => {
      // EMA with period=3: first EMA = SMA of first 3 values = (10+20+30)/3 = 20
      // multiplier = 2/(3+1) = 0.5
      const data = [
        { time: 1, value: 10 },
        { time: 2, value: 20 },
        { time: 3, value: 30 },
        { time: 4, value: 40 },
      ]
      const result = ema(data, 3)
      expect(result).toHaveLength(4)
      // Before period completes, carry forward initial SMA
      expect(result[0].value).toBe(20) // initial SMA
      expect(result[1].value).toBe(20) // carry forward
      expect(result[2].value).toBe(20) // initial SMA at period boundary
      // First actual EMA update at i=3
      expect(result[3].value).toBe(30) // (40-20)*0.5 + 20
    })

    it('handles data shorter than period', () => {
      const data = [
        { time: 1, value: 10 },
        { time: 2, value: 20 },
      ]
      const result = ema(data, 5)
      // data.length < period, so prevEma = data[0].value = 10
      expect(result).toHaveLength(2)
      expect(result[0].value).toBe(10)
      expect(result[1].value).toBe(10) // carry forward
    })
  })

  describe('stdDevBands', () => {
    it('returns empty array for empty input', () => {
      expect(stdDevBands([], 3, 2)).toEqual([])
    })

    it('computes bands for constant data', () => {
      const data = [
        { time: 1, value: 10 },
        { time: 2, value: 10 },
        { time: 3, value: 10 },
      ]
      const result = stdDevBands(data, 3, 2)
      expect(result[0].middle).toBeNull()
      expect(result[1].middle).toBeNull()
      expect(result[2].middle).toBe(10)
      expect(result[2].upper).toBe(10) // stdDev = 0
      expect(result[2].lower).toBe(10)
    })

    it('computes bands for varying data', () => {
      const data = [
        { time: 1, value: 8 },
        { time: 2, value: 10 },
        { time: 3, value: 12 },
      ]
      const result = stdDevBands(data, 3, 2)
      // mean = 10, variance = ((4+0+4)/3) = 8/3, stdDev = sqrt(8/3)
      expect(result[2].middle).toBe(10)
      expect(result[2].upper).toBeCloseTo(10 + 2 * Math.sqrt(8 / 3), 5)
      expect(result[2].lower).toBeCloseTo(10 - 2 * Math.sqrt(8 / 3), 5)
    })
  })

  describe('trendLine', () => {
    it('returns empty array for empty input', () => {
      expect(trendLine([])).toEqual([])
    })

    it('computes slope=1 for linear data', () => {
      const data = [
        { time: '2024-01-01', value: 1 },
        { time: '2024-01-02', value: 2 },
        { time: '2024-01-03', value: 3 },
        { time: '2024-01-04', value: 4 },
        { time: '2024-01-05', value: 5 },
      ]
      const result = trendLine(data)
      expect(result).toHaveLength(5)
      expect(result[0].value).toBeCloseTo(1, 5)
      expect(result[4].value).toBeCloseTo(5, 5)
    })

    it('handles single element', () => {
      const data = [{ time: '2024-01-01', value: 42 }]
      const result = trendLine(data)
      expect(result).toHaveLength(1)
      expect(result[0].value).toBe(42)
    })
  })

  describe('minMaxBand', () => {
    it('returns empty array for empty input', () => {
      expect(minMaxBand([])).toEqual([])
    })

    it('tracks running min/max', () => {
      const data = [
        { time: 1, value: 10 },
        { time: 2, value: 30 },
        { time: 3, value: 5 },
        { time: 4, value: 20 },
      ]
      const result = minMaxBand(data)
      expect(result[0].min).toBe(10)
      expect(result[0].max).toBe(10)
      expect(result[1].min).toBe(10)
      expect(result[1].max).toBe(30)
      expect(result[2].min).toBe(5)
      expect(result[2].max).toBe(30)
      expect(result[3].min).toBe(5)
      expect(result[3].max).toBe(30)
    })
  })

  describe('aggregateDaily', () => {
    it('returns empty array for empty input', () => {
      expect(aggregateDaily([])).toEqual([])
    })

    it('groups records by date', () => {
      const records = [
        { time: '2024-01-01T08:00:00Z', value: 3.5 },
        { time: '2024-01-01T14:00:00Z', value: 3.7 },
        { time: '2024-01-02T08:00:00Z', value: 3.6 },
      ]
      const result = aggregateDaily(records)
      expect(result).toHaveLength(2)
      expect(result[0].count).toBe(2)
      expect(result[0].value).toBeCloseTo(3.6, 5)
      expect(result[0].min).toBe(3.5)
      expect(result[0].max).toBe(3.7)
      expect(result[0].time).toBe('2024-01-01')
    })

    it('sorts results by date', () => {
      const records = [
        { time: '2024-01-03T08:00:00Z', value: 3.6 },
        { time: '2024-01-01T08:00:00Z', value: 3.5 },
      ]
      const result = aggregateDaily(records)
      expect(result[0].time).toBe('2024-01-01')
      expect(result[1].time).toBe('2024-01-03')
    })
  })

  describe('aggregateWeekly', () => {
    it('returns empty array for empty input', () => {
      expect(aggregateWeekly([])).toEqual([])
    })

    it('groups records by ISO week', () => {
      const records = [
        { time: '2024-01-01T08:00:00Z', value: 3.5 }, // Mon, week 1
        { time: '2024-01-02T08:00:00Z', value: 3.6 }, // Tue, week 1
        { time: '2024-01-08T08:00:00Z', value: 3.7 }, // Mon, week 2
      ]
      const result = aggregateWeekly(records)
      expect(result).toHaveLength(2)
      expect(result[0].time).toBe('2024-W01')
      expect(result[0].count).toBe(2)
      expect(result[0].value).toBeCloseTo(3.55, 5)
      expect(result[1].time).toBe('2024-W02')
      expect(result[1].count).toBe(1)
    })

    it('sorts results by week key', () => {
      const records = [
        { time: '2024-01-08T08:00:00Z', value: 3.7 }, // week 2
        { time: '2024-01-01T08:00:00Z', value: 3.5 }, // week 1
      ]
      const result = aggregateWeekly(records)
      expect(result[0].time).toBe('2024-W01')
      expect(result[1].time).toBe('2024-W02')
    })
  })

  describe('percentiles', () => {
    it('returns empty object for empty input', () => {
      expect(percentiles([], [25, 50, 75])).toEqual({})
    })

    it('computes percentiles with sliding window', () => {
      const data = [
        { time: 1, value: 1 },
        { time: 2, value: 2 },
        { time: 3, value: 3 },
        { time: 4, value: 4 },
        { time: 5, value: 5 },
      ]
      const result = percentiles(data, [25, 50, 75])
      // windowSize = max(floor(5/4), 1) = 1, so each window is just the current value
      expect(result.p25).toBeDefined()
      expect(result.p50).toBeDefined()
      expect(result.p75).toBeDefined()
      expect(result.p50).toHaveLength(5)
      expect(result.p50[2].value).toBe(3)
    })

    it('returns correct keys for given percentiles', () => {
      const data = [
        { time: 1, value: 10 },
        { time: 2, value: 20 },
      ]
      const result = percentiles(data, [10, 90])
      expect(result.p10).toBeDefined()
      expect(result.p90).toBeDefined()
      expect(result.p50).toBeUndefined()
    })
  })
})
