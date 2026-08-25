import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';
import { getTraceUrl } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export function QrCodeDisplay({ batchCode, size = 160 }: { batchCode: string; size?: number }) {
  const traceUrl = getTraceUrl(batchCode);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(traceUrl);
    setCopied(true);
    toast('Trace URL copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const svg = document.getElementById(`qr-${batchCode}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.scale(2, 2);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const link = document.createElement('a');
      link.download = `qr-${batchCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('QR code downloaded', 'success');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl border-2 border-earth-200 bg-white p-4">
        <QRCodeSVG id={`qr-${batchCode}`} value={traceUrl} size={size} level="M" includeMargin />
      </div>
      <p className="text-center text-xs text-earth-500">{traceUrl}</p>
      <div className="flex gap-2">
        <button onClick={copyUrl} className="btn-ghost text-xs">
          {copied ? <Check className="h-3 w-3 text-success-600" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy URL'}
        </button>
        <button onClick={download} className="btn-ghost text-xs">
          <Download className="h-3 w-3" /> Download
        </button>
      </div>
    </div>
  );
}
