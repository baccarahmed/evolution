import React, { useEffect, useRef, memo, useState } from 'react';

const TradingViewChart = memo(({ symbol = 'BINANCE:BTCUSDT' }) => {
  const container = useRef();
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const currentContainer = container.current;
    if (!currentContainer) return;

    // Clear previous widget
    currentContainer.innerHTML = '';
    setLoadError(false);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    script.onerror = () => {
      console.error("Failed to load TradingView advanced chart script");
      setLoadError(true);
    };

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'fr',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: 'tradingview_chart_' + Math.random().toString(36).substring(7),
      support_host: 'https://www.tradingview.com'
    });
    
    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ 
        height: '100%', 
        width: '100%', 
        minHeight: '400px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {loadError ? (
        <div className="chart-error-fallback" style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
          <p>Graphique indisponible (Connexion réseau requise)</p>
        </div>
      ) : (
        <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
      )}
    </div>
  );
});

export default TradingViewChart;
