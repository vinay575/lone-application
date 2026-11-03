import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, ScanLine, Smartphone } from 'lucide-react';
import { buildUpiUri, UPI_PAYEE, UPI_VPA } from '../lib/upi.js';
import { formatINR } from '../lib/format.js';

export default function UpiScanner({ amount, planName, txnRef, reference }) {
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  const uri = buildUpiUri({
    amount,
    note: `LoanLedger ${planName || ''}`.trim(),
    txnRef,
  });

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(uri, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b2545', light: '#ffffff' },
    })
      .then((url) => { if (alive) setQr(url); })
      .catch(() => { if (alive) setQr(''); });
    return () => { alive = false; };
  }, [uri]);

  const copyVpa = async () => {
    try {
      await navigator.clipboard.writeText(UPI_VPA);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="upi-scan fade-up">
      <div className="upi-scan-head">
        <span className="upi-scan-title">
          <ScanLine size={16} /> Scan &amp; pay
        </span>
        <span className="upi-scan-amount">{formatINR(amount)}</span>
      </div>

      <div className="upi-qr-frame">
        {qr ? (
          <img src={qr} alt={`UPI QR code to pay ${formatINR(amount)} for ${planName || 'selected plan'}`} width={220} height={220} />
        ) : (
          <div className="upi-qr-loading">Generating QR…</div>
        )}
      </div>

      <p className="upi-scan-steps">
        Open <strong>PhonePe</strong>, Google Pay or Paytm on your phone → tap <strong>Scan QR</strong> →
        point the camera at this code. The selected amount of <strong>{formatINR(amount)}</strong> is
        filled in automatically — just confirm with your UPI PIN.
      </p>

      <div className="upi-vpa">
        <span className="text-sm text-muted">
          Or pay to <strong style={{ color: 'var(--navy-900)' }}>{UPI_VPA}</strong> ({UPI_PAYEE})
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={copyVpa}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy UPI ID'}
        </button>
      </div>

      <a className="btn btn-teal btn-block" href={uri}>
        <Smartphone size={16} /> Open in PhonePe / UPI app
      </a>
      {reference && (
        <p className="center text-sm text-muted" style={{ marginTop: '0.6rem', marginBottom: 0 }}>
          Reference {reference}
        </p>
      )}
    </div>
  );
}
