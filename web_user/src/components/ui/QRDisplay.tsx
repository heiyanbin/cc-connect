import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

type QRStatus = 'loading' | 'scanning' | 'scanned' | 'confirmed' | 'expired' | 'error';

interface QRDisplayProps {
  qrUrl: string;
  status: QRStatus;
  error?: string;
  onRetry?: () => void;
}

export function QRDisplay({ qrUrl, status, error, onRetry }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        {status === 'loading' ? (
          <div className="w-[200px] h-[200px] flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <QRCodeSVG value={qrUrl} size={200} level="H" />
        )}
      </div>

      {/* Status */}
      <div className="mt-4 text-center">
        {status === 'loading' && (
          <p className="text-gray-500">Generating QR code...</p>
        )}
        {status === 'scanning' && (
          <p className="text-gray-500">Scan with WeChat to connect</p>
        )}
        {status === 'scanned' && (
          <div className="flex items-center gap-2 text-amber-500">
            <CheckCircle2 size={16} />
            <span>Scanned! Confirm on phone...</span>
          </div>
        )}
        {status === 'confirmed' && (
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 size={16} />
            <span>Connected!</span>
          </div>
        )}
        {status === 'expired' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle size={16} />
              <span>QR expired</span>
            </div>
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw size={14} className="mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle size={16} />
              <span>{error || 'Error'}</span>
            </div>
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw size={14} className="mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}