/**
 * @typedef {Object} HistoryRecord
 * @property {string} time - ISO timestamp
 * @property {string} local_time - Local time string
 * @property {string} station_name - Station name
 * @property {string} address - Station address
 * @property {string} zip_code - ZIP code
 * @property {number} price_regular - Regular gas price
 */

/**
 * @typedef {Object} HistoryParams
 * @property {string} [zip_code] - Optional ZIP filter
 * @property {string} [station_name] - Optional station name filter
 * @property {number} [limit] - Max records (default 10000)
 */

/**
 * @typedef {Object} ComputedSeries
 * @property {string} time - ISO timestamp
 * @property {number} value - Price value
 * @property {number} [sma7] - 7-period SMA
 * @property {number} [sma30] - 30-period SMA
 * @property {number} [ema12] - 12-period EMA
 * @property {number} [upperBand] - Upper volatility band
 * @property {number} [lowerBand] - Lower volatility band
 * @property {number} [p25] - 25th percentile
 * @property {number} [p50] - 50th percentile
 * @property {number} [p75] - 75th percentile
 * @property {number} [trendValue] - Trend line value
 */

/**
 * @typedef {Object} ChartData
 * @property {HistoryRecord[]} records - Raw history records
 * @property {ComputedSeries[]} series - Computed indicator series
 * @property {number} count - Record count
 */
