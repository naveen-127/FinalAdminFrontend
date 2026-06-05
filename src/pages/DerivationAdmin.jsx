import React, { useEffect, useState } from 'react';

const DerivationAdmin = () => {
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    // 1. Get state from sessionStorage to restore parameters after going back
    let cardId = '';
    let mode = '';
    try {
      const storedState = sessionStorage.getItem('adminReturnState');
      if (storedState) {
        const parsed = JSON.parse(storedState);
        cardId = parsed.cardId || '';
        mode = parsed.mode || '';
      }
    } catch (e) {
      console.error('Error reading adminReturnState from sessionStorage', e);
    }

    // 2. Determine the correct backend origin (use env variable with hostname-based fallbacks)
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendOrigin = import.meta.env.VITE_ADMIN_LAB_BACKEND_URL || (isDev
      ? 'http://localhost:5000'
      : 'https://d2l8p0hsuvduse.cloudfront.net');

    // 3. Construct the returnUrl pointing back to our parent site origin
    const returnUrl = encodeURIComponent(window.location.origin);
    const cardParam = encodeURIComponent(cardId);
    const modeParam = encodeURIComponent(mode);

    // 4. Set the final src with query parameters so Flask app can customize itself
    const srcUrl = `${backendOrigin}/adminhome/derivation/?returnUrl=${returnUrl}&card=${cardParam}&mode=${modeParam}`;
    setIframeSrc(srcUrl);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#fff' }}>
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title="Derivation Admin Dashboard"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
        />
      )}
    </div>
  );
};

export default DerivationAdmin;
