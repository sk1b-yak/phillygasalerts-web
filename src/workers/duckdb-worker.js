import * as duckdb from '@duckdb/duckdb-wasm';

let db = null;
let conn = null;
let isInitialized = false;
let currentTimeframe = '6h';

async function initDuckDB() {
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  
  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
  );
  
  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  conn = await db.connect();
  
  self.postMessage({ type: 'ready' });
}

function parseTimeframe(timeframe) {
  const mapping = {
    '6h':  6,
    '24h': 24,
    '3d':  72,  // 3 * 24
    '7d':  168, // 7 * 24
    'all': 24,  // 24h candles for "All" timeframe
  };
  return mapping[timeframe] || 6;
}

function getFuelTypeFromGasType(gasType) {
  const mapping = {
    'regular': 'REGULAR_UNLEADED',
    'midgrade': 'MIDGRADE',
    'premium': 'PREMIUM',
    'diesel': 'DIESEL',
  };
  return mapping[gasType];
}

function computeCandles(records, intervalHours = 6, gasType = 'regular') {
  if (!records || records.length === 0) return [];
  
  const buckets = new Map();
  
  // Filter by fuel_type if gasType is specified and not 'regular'
  const fuelTypeFilter = getFuelTypeFromGasType(gasType);
  
  for (const record of records) {
    // Skip if gas type filter is active and record doesn't match
    if (fuelTypeFilter && record.fuel_type && record.fuel_type !== fuelTypeFilter) {
      continue;
    }
    const stationKey = record.station_name || record.station_key || 'unknown';
    const zipCode = record.zip_code || '';
    const time = new Date(record.time || record.scraped_at);
    const price = parseFloat(record.price_regular || record.price);
    
    if (isNaN(price)) continue;
    
    const bucketTime = new Date(time);
    bucketTime.setMinutes(0, 0, 0);
    bucketTime.setHours(Math.floor(bucketTime.getHours() / intervalHours) * intervalHours);
    const bucketKey = `${stationKey}_${bucketTime.toISOString()}`;
    
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        station_key: stationKey,
        zip_code: zipCode,
        bucket: bucketTime.toISOString(),
        prices: [],
      });
    }
    
    buckets.get(bucketKey).prices.push({
      time: time.getTime(),
      price: price,
    });
  }
  
  const candles = [];
  for (const bucket of buckets.values()) {
    if (bucket.prices.length === 0) continue;
    
    bucket.prices.sort((a, b) => a.time - b.time);
    
    const open = bucket.prices[0].price;
    const close = bucket.prices[bucket.prices.length - 1].price;
    const high = Math.max(...bucket.prices.map(p => p.price));
    const low = Math.min(...bucket.prices.map(p => p.price));
    
    candles.push({
      station_key: bucket.station_key,
      zip_code: bucket.zip_code,
      bucket: bucket.bucket,
      open_price: open,
      high_price: high,
      low_price: low,
      close_price: close,
      candle_count: bucket.prices.length,
    });
  }
  
  candles.sort((a, b) => new Date(a.bucket) - new Date(b.bucket));
  
  return candles;
}

function getTableName(timeframe) {
  return `price_candles_${timeframe}`;
}

async function initCandlesTable(records, timeframe, gasType = 'regular') {
  const intervalHours = parseTimeframe(timeframe);
  const tableName = getTableName(timeframe);

  console.log(`[Worker] Computing ${timeframe} candles with ${intervalHours}h interval, gasType: ${gasType}`);

  const candles = computeCandles(records, intervalHours, gasType);
  console.log('[Worker] Computed candles:', candles.length);
  
  await conn.query(`DROP TABLE IF EXISTS ${tableName}`);
  
  await conn.query(`
    CREATE TABLE ${tableName} (
      station_key TEXT,
      zip_code TEXT,
      bucket TIMESTAMP,
      open_price DOUBLE,
      high_price DOUBLE,
      low_price DOUBLE,
      close_price DOUBLE,
      candle_count INTEGER
    )
  `);
  
  if (candles.length > 0) {
    const insertStmt = await conn.prepare(`
      INSERT INTO ${tableName}
      (station_key, zip_code, bucket, open_price, high_price, low_price, close_price, candle_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const candle of candles) {
      await insertStmt.query(
        candle.station_key,
        candle.zip_code,
        candle.bucket,
        candle.open_price,
        candle.high_price,
        candle.low_price,
        candle.close_price,
        candle.candle_count
      );
    }
  }
  
  return candles.length;
}

self.onmessage = async (e) => {
  if (e.data.type === 'ping') {
    self.postMessage({ type: 'pong', timestamp: Date.now() });
  }

  if (e.data.type === 'init_candles') {
    const { records, timeframe = '6h', dataSources, gasType = 'regular' } = e.data;
    currentTimeframe = timeframe;
    console.log('[Worker] init_candles received:', records?.length, 'records, timeframe:', timeframe, 'dataSources:', dataSources);

    try {
      // Filter records by data_source if specified
      let filteredRecords = records;
      if (dataSources && dataSources.length > 0 && dataSources.length < 5) {
        filteredRecords = records.filter(r => dataSources.includes(r.data_source));
        console.log('[Worker] Filtered records by data_source:', filteredRecords.length, 'of', records.length);
      }

      const timeframes = ['6h', '24h', '3d', '7d', 'all'];
      const results = {};

      for (const tf of timeframes) {
        const count = await initCandlesTable(filteredRecords, tf, gasType);
        results[tf] = count;
      }

      isInitialized = true;
      console.log('[Worker] init_complete - candles created:', results);
      self.postMessage({ type: 'init_complete', counts: results, timeframe: currentTimeframe });
    } catch (error) {
      self.postMessage({ type: 'error', message: error.message });
    }
  }

  if (e.data.type === 'set_timeframe') {
    const { timeframe } = e.data;
    const validTimeframes = ['6h', '24h', '3d', '7d', 'all'];
    if (validTimeframes.includes(timeframe)) {
      currentTimeframe = timeframe;
      console.log('[Worker] Timeframe changed to:', timeframe);
      self.postMessage({ type: 'timeframe_changed', timeframe: currentTimeframe });
    } else {
      self.postMessage({ type: 'error', message: `Invalid timeframe: ${timeframe}` });
    }
  }

  if (e.data.type === 'query_station') {
    console.log('[Worker] query_station received:', e.data);
    if (!isInitialized) {
      self.postMessage({ type: 'error', message: 'Candles not initialized. Call init_candles first.' });
      return;
    }
    
    try {
      const { stationKey, startTime, endTime, timeframe: rawTf_s = currentTimeframe } = e.data;
      const timeframe = ['6h','24h','3d','7d','all'].includes(rawTf_s) ? rawTf_s : '6h';
      if (!['6h','24h','3d','7d','all'].includes(rawTf_s)) console.warn('[Worker] Invalid TF for station query:', rawTf_s, '=> 6h');
      const tableName = getTableName(timeframe);
      console.log('[Worker] Executing station query:', stationKey, startTime, 'to', endTime, 'timeframe:', timeframe);
      
      const stmt = await conn.prepare(`
        SELECT
          bucket AS time,
          open_price AS open,
          high_price AS high,
          low_price AS low,
          close_price AS close,
          candle_count
        FROM ${tableName}
        WHERE station_key = ?
          AND bucket BETWEEN ? AND ?
        ORDER BY bucket
      `);
      const result = await stmt.query(stationKey, startTime, endTime);
      const resultArray = result.toArray().map(r => ({...r}));
      console.log('[Worker] query_station result:', resultArray.length, 'rows');
      self.postMessage({ type: 'result', queryType: 'station', data: resultArray, timeframe });
    } catch (error) {
      self.postMessage({ type: 'error', message: error.message });
    }
  }

  if (e.data.type === 'query_zip') {
    console.log('[Worker] query_zip received:', e.data);
    if (!isInitialized) {
      self.postMessage({ type: 'error', message: 'Candles not initialized. Call init_candles first.' });
      return;
    }
    
    try {
      const { zipCode, startTime, endTime, timeframe: rawTf_z = currentTimeframe } = e.data;
      const timeframe = ['6h','24h','3d','7d','all'].includes(rawTf_z) ? rawTf_z : '6h';
      if (!['6h','24h','3d','7d','all'].includes(rawTf_z)) console.warn('[Worker] Invalid TF for zip query:', rawTf_z, '=> 6h');
      const tableName = getTableName(timeframe);
      console.log('[Worker] Executing zip query:', zipCode, startTime, 'to', endTime, 'timeframe:', timeframe);
      
      const stmt = await conn.prepare(`
        SELECT
          bucket AS time,
          AVG(open_price) AS open,
          MAX(high_price) AS high,
          MIN(low_price) AS low,
          AVG(close_price) AS close,
          SUM(candle_count) AS candle_count
        FROM ${tableName}
        WHERE zip_code = ?
          AND bucket BETWEEN ? AND ?
        GROUP BY bucket
        ORDER BY bucket
      `);
      const result = await stmt.query(zipCode, startTime, endTime);
      const resultArray = result.toArray().map(r => ({...r}));
      console.log('[Worker] query_zip result:', resultArray.length, 'rows');
      self.postMessage({ type: 'result', queryType: 'zip', data: resultArray, timeframe });
    } catch (error) {
      self.postMessage({ type: 'error', message: error.message });
    }
  }

  if (e.data.type === 'query_global') {
    console.log('[Worker] query_global received:', e.data);
    if (!isInitialized) {
      self.postMessage({ type: 'error', message: 'Candles not initialized. Call init_candles first.' });
      return;
    }
    
    try {
      const { startTime, endTime, timeframe: rawTf_g = currentTimeframe } = e.data;
      const timeframe = ['6h','24h','3d','7d','all'].includes(rawTf_g) ? rawTf_g : '6h';
      if (!['6h','24h','3d','7d','all'].includes(rawTf_g)) console.warn('[Worker] Invalid TF for global query:', rawTf_g, '=> 6h');
      const tableName = getTableName(timeframe);
      console.log('[Worker] Executing global query:', startTime, 'to', endTime, 'timeframe:', timeframe);
      
      const stmt = await conn.prepare(`
        SELECT
          bucket AS time,
          AVG(open_price) AS open,
          MAX(high_price) AS high,
          MIN(low_price) AS low,
          AVG(close_price) AS close,
          SUM(candle_count) AS candle_count
        FROM ${tableName}
        WHERE bucket BETWEEN ? AND ?
        GROUP BY bucket
        ORDER BY bucket
      `);
      const result = await stmt.query(startTime, endTime);
      const resultArray = result.toArray().map(r => ({...r}));
      console.log('[Worker] query_global result:', resultArray.length, 'rows');
      self.postMessage({ type: 'result', queryType: 'global', data: resultArray, timeframe });
    } catch (error) {
      self.postMessage({ type: 'error', message: error.message });
    }
  }
};

initDuckDB();
