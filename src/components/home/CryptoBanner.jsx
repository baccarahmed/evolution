import React from 'react';
import './CryptoBanner.css';

const cryptoLogos = [
  { 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    color: '#F7931A',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png' 
  },
  { 
    name: 'Ethereum', 
    symbol: 'ETH', 
    color: '#627EEA',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png' 
  },
  { 
    name: 'Solana', 
    symbol: 'SOL', 
    color: '#14F195',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/sol.png' 
  },
  { 
    name: 'Cardano', 
    symbol: 'ADA', 
    color: '#0033AD',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ada.png' 
  },
  { 
    name: 'Ripple', 
    symbol: 'XRP', 
    color: '#23292F',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xrp.png' 
  },
  { 
    name: 'Polkadot', 
    symbol: 'DOT', 
    color: '#E6007A',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/dot.png' 
  },
  { 
    name: 'Chainlink', 
    symbol: 'LINK', 
    color: '#2A5ADA',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/link.png' 
  },
  { 
    name: 'Polygon', 
    symbol: 'MATIC', 
    color: '#8247E5',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/matic.png' 
  },
  { 
    name: 'Litecoin', 
    symbol: 'LTC', 
    color: '#345D9D',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ltc.png' 
  },
  { 
    name: 'Avalanche', 
    symbol: 'AVAX', 
    color: '#E84142',
    icon: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/avax.png' 
  },
];

const CryptoBanner = () => {
  const duplicatedLogos = [...cryptoLogos, ...cryptoLogos, ...cryptoLogos];

  return (
    <div className="crypto-banner-container">
      <div className="crypto-banner-track">
        {duplicatedLogos.map((crypto, index) => (
          <div key={`${crypto.name}-${index}`} className="crypto-logo-item">
            <div className="crypto-3d-wrapper">
              <div className="crypto-coin" style={{ '--coin-color': crypto.color }}>
                {/* Coin front face */}
                <div className="coin-face coin-front">
                  <img 
                    src={crypto.icon} 
                    alt={crypto.name} 
                    crossOrigin="anonymous"
                    className="coin-logo-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="crypto-symbol-fallback" style={{ display: 'none' }}>{crypto.symbol}</span>
                </div>
                {/* Coin back face */}
                <div className="coin-face coin-back">
                  <img 
                    src={crypto.icon} 
                    alt={crypto.name} 
                    crossOrigin="anonymous"
                    className="coin-logo-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <span className="crypto-symbol-fallback" style={{ display: 'none' }}>{crypto.symbol}</span>
                </div>
                {/* 3D edge effect */}
                <div className="coin-edge"></div>
              </div>
              <span className="crypto-name" style={{ '--coin-color': crypto.color }}>{crypto.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoBanner;
