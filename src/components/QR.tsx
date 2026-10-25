import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export function QR({ value, size = 180, label }: { value: string; size?: number; label: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(value, { type: 'svg', margin: 1, color: { dark: '#15233F', light: '#FFFFFF' }, errorCorrectionLevel: 'M' })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [value]);
  return <div className="qr" style={{ width: size, height: size }} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
