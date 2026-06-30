import React, { useEffect, useState } from 'react';
import './PriceTicker.css';

const PriceTicker = () => {
  const [loadError, setLoadError] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    
    script.onerror = () => {
      console.error("Failed to load TradingView ticker script");
      setLoadError(true);
    };

    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "FOREXCOM:SPX500", "title": "S&P 500" },
        { "proName": "FOREXCOM:NSX100", "title": "Nasdaq 100" },
        { "proName": "FX_IDC:EURUSD", "title": "EUR/USD" },
        { "proName": "FX_IDC:GBPUSD", "title": "GBP/USD" },
        { "proName": "FX_IDC:USDJPY", "title": "USD/JPY" },
        { "proName": "BITSTAMP:BTCUSD", "title": "BTC/USD" },
        { "proName": "BITSTAMP:ETHUSD", "title": "ETH/USD" },
        { "proName": "BINANCE:BNBUSD", "title": "BNB/USD" },
        { "proName": "BINANCE:SOLUSD", "title": "SOL/USD" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "isTransparent": false,
      "displayMode": "adaptive",
      "locale": "fr"
    });
    
    // Clear the container before appending
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  if (loadError) return null;

  return (
    <div className="ticker-wrapper">
      <div id="tradingview-ticker-container">
        <div className="tradingview-widget-container">
          <div ref={containerRef} className="tradingview-widget-container__widget"></div>
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
