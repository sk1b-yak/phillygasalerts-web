import { useEffect, useRef, useState, useCallback } from 'react';

export function useDuckDBWorker() {
  const workerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Lazy load worker
    workerRef.current = new Worker(
      new URL('../workers/duckdb-worker.js', import.meta.url),
      { type: 'module' }
    );
    
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'ready') {
        setIsReady(true);
      }
      if (e.data.type === 'init_complete') {
        setIsInitialized(true);
        setError(null);
      }
      if (e.data.type === 'result') {
        setLastResult(e.data);
        setError(null);
      }
      if (e.data.type === 'error') {
        setError(e.data.message);
        console.error('[DuckDB Worker Error]:', e.data.message);
      }
    };
    
    workerRef.current.onerror = (err) => {
      setError(err.message);
      console.error('[DuckDB Worker Error]:', err);
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  
  const initCandles = useCallback((records, dataSources, selectedGasType = 'regular') => {
    if (!workerRef.current || !isReady) return;
    if (!records || records.length === 0) return;

    workerRef.current.postMessage({
      type: 'init_candles',
      records,
      dataSources,
      gasType: selectedGasType
    });
  }, [isReady]);
  
  const query = useCallback((type, params) => {
    if (!workerRef.current || !isReady || !isInitialized) return;
    workerRef.current.postMessage({ type, ...params });
  }, [isReady, isInitialized]);
  
  return { 
    isReady, 
    isInitialized,
    query, 
    initCandles,
    lastResult,
    error 
  };
}
