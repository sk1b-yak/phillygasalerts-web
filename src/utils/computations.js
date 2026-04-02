// Price computation utilities — pure functions, no side effects

/**
 * Simple Moving Average
 * @param {Array<{time: *, value: number}>} data - Input time series
 * @param {number} period - Window size
 * @returns {Array<{time: *, value: number|null}>}
 */
export function sma(data, period) {
  if (!data || data.length === 0 || period < 1) return []

  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ time: data[i].time, value: null })
    } else {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].value
      }
      result.push({ time: data[i].time, value: sum / period })
    }
  }
  return result
}

/**
 * Exponential Moving Average
 * @param {Array<{time: *, value: number}>} data
 * @param {number} period
 * @returns {Array<{time: *, value: number}>}
 */
export function ema(data, period) {
  if (!data || data.length === 0 || period < 1) return []

  const multiplier = 2 / (period + 1)
  const result = []

  // First EMA = SMA of first `period` values (or first value if data shorter)
  let prevEma
  if (data.length >= period) {
    let sum = 0
    for (let i = 0; i < period; i++) {
      sum += data[i].value
    }
    prevEma = sum / period
  } else {
    prevEma = data[0].value
  }

  for (let i = 0; i < data.length; i++) {
    if (i === 0 && data.length < period) {
      result.push({ time: data[i].time, value: prevEma })
    } else if (i < period - 1) {
      // Before the SMA window completes, carry forward the initial SMA
      result.push({ time: data[i].time, value: prevEma })
    } else if (i === period - 1) {
      result.push({ time: data[i].time, value: prevEma })
    } else {
      prevEma = (data[i].value - prevEma) * multiplier + prevEma
      result.push({ time: data[i].time, value: prevEma })
    }
  }
  return result
}

/**
 * Standard Deviation Bands (Bollinger-style)
 * @param {Array<{time: *, value: number}>} data
 * @param {number} period - Window for std dev calculation
 * @param {number} multiplier - Band width (1 for ±1σ, 2 for ±2σ)
 * @returns {Array<{time: *, upper: number|null, lower: number|null, middle: number|null}>}
 */
export function stdDevBands(data, period, multiplier) {
  if (!data || data.length === 0 || period < 1) return []

  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ time: data[i].time, upper: null, lower: null, middle: null })
    } else {
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j].value
      }
      const mean = sum / period

      let sqDiffSum = 0
      for (let j = i - period + 1; j <= i; j++) {
        const diff = data[j].value - mean
        sqDiffSum += diff * diff
      }
      const stdDev = Math.sqrt(sqDiffSum / period)

      result.push({
        time: data[i].time,
        middle: mean,
        upper: mean + multiplier * stdDev,
        lower: mean - multiplier * stdDev
      })
    }
  }
  return result
}

/**
 * Percentile lines — running percentiles using sliding window
 * @param {Array<{time: *, value: number}>} data
 * @param {number[]} percentiles - e.g. [25, 50, 75]
 * @returns {Object} { p25: [...], p50: [...], p75: [...] } each as [{time, value}]
 */
export function percentiles(data, percentiles) {
  if (!data || data.length === 0 || !percentiles || percentiles.length === 0) return {}

  const windowSize = Math.max(Math.floor(data.length / 4), 1)
  const result = {}

  for (const p of percentiles) {
    const key = `p${p}`
    result[key] = []
  }

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = []
    for (let j = start; j <= i; j++) {
      window.push(data[j].value)
    }
    window.sort((a, b) => a - b)

    for (const p of percentiles) {
      const key = `p${p}`
      const index = Math.max(0, Math.min(window.length - 1, Math.floor((p / 100) * (window.length - 1))))
      result[key].push({ time: data[i].time, value: window[index] })
    }
  }

  return result
}

/**
 * Linear regression trend line
 * @param {Array<{time: *, value: number}>} data
 * @returns {Array<{time: *, value: number}>}
 */
export function trendLine(data) {
  if (!data || data.length === 0) return []
  if (data.length === 1) return [{ time: data[0].time, value: data[0].value }]

  const n = data.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += data[i].value
    sumXY += i * data[i].value
    sumXX += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const result = []
  for (let i = 0; i < n; i++) {
    result.push({ time: data[i].time, value: slope * i + intercept })
  }
  return result
}

/**
 * Aggregate records by day
 * @param {Array<{time: string, value: number}>} records
 * @returns {Array<{time: string, value: number, min: number, max: number, count: number}>}
 */
export function aggregateDaily(records) {
  if (!records || records.length === 0) return []

  const groups = new Map()

  for (const record of records) {
    const date = new Date(record.time)
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    if (!groups.has(dayKey)) {
      groups.set(dayKey, { values: [], times: [] })
    }
    const group = groups.get(dayKey)
    group.values.push(record.value)
    group.times.push(record.time)
  }

  const result = []
  for (const [dayKey, group] of groups) {
    let sum = 0
    let min = Infinity
    let max = -Infinity
    for (const v of group.values) {
      sum += v
      if (v < min) min = v
      if (v > max) max = v
    }
    result.push({
      time: dayKey,
      value: sum / group.values.length,
      min,
      max,
      count: group.values.length
    })
  }

  result.sort((a, b) => a.time.localeCompare(b.time))
  return result
}

/**
 * Aggregate records by ISO week
 * @param {Array<{time: string, value: number}>} records
 * @returns {Array<{time: string, value: number, min: number, max: number, count: number}>}
 */
export function aggregateWeekly(records) {
  if (!records || records.length === 0) return []

  const groups = new Map()

  for (const record of records) {
    const date = new Date(record.time)
    const isoWeek = getISOWeek(date)
    const isoYear = getISOWeekYear(date)
    const weekKey = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`

    if (!groups.has(weekKey)) {
      groups.set(weekKey, { values: [], times: [] })
    }
    const group = groups.get(weekKey)
    group.values.push(record.value)
    group.times.push(record.time)
  }

  const result = []
  for (const [weekKey, group] of groups) {
    let sum = 0
    let min = Infinity
    let max = -Infinity
    for (const v of group.values) {
      sum += v
      if (v < min) min = v
      if (v > max) max = v
    }
    const [year, week] = weekKey.split('-W').map(Number)
    const weekDate = getDateFromISOWeek(year, week)
    result.push({
      time: weekDate.toISOString(),
      value: sum / group.values.length,
      min,
      max,
      count: group.values.length
    })
  }

  result.sort((a, b) => new Date(a.time) - new Date(b.time))
  return result
}

/**
 * Get ISO week number (1-53)
 * @param {Date} date
 * @returns {number}
 */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Get ISO week year (may differ from calendar year)
 * @param {Date} date
 * @returns {number}
 */
function getISOWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  return d.getUTCFullYear()
}

/**
 * Get date from ISO week number (Monday of that week)
 * @param {number} year - ISO week year
 * @param {number} week - ISO week number (1-53)
 * @returns {Date}
 */
function getDateFromISOWeek(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const dow = simple.getDay()
  const ISOweekStart = simple
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
  }
  return ISOweekStart
}

/**
 * Running min/max envelope
 * @param {Array<{time: *, value: number}>} data
 * @returns {Array<{time: *, min: number, max: number}>}
 */
export function minMaxBand(data) {
  if (!data || data.length === 0) return []

  const result = []
  let runningMin = Infinity
  let runningMax = -Infinity

  for (let i = 0; i < data.length; i++) {
    const v = data[i].value
    if (v < runningMin) runningMin = v
    if (v > runningMax) runningMax = v
    result.push({ time: data[i].time, min: runningMin, max: runningMax })
  }

  return result
}
