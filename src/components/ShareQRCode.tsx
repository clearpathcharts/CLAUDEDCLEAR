import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function ShareQRCode() {
  const [copied, setCopied] = useState(false);
  const url = "https://clearpath.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById('share-qr-code');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'clearpath_qr.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-12 bg-black/40 rounded-3xl border border-white/5 backdrop-blur-xl">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">Share Access</h2>
        <p className="text-[#FF4500] font-mono text-xs tracking-[0.2em] font-bold">Market Terminal Protocol</p>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative group"
      >
        {/* The requested design wrapper */}
        <div style={{
          background: 'radial-gradient(circle at center, #00ffff 0%, #4b00ff 40%, #ff00aa 80%)',
          padding: '25px',
          display: 'inline-block',
          borderRadius: '20px',
          boxShadow: '0 0 40px #00ffff, 0 0 60px #ff00aa'
        }}>
          <div className="bg-black p-2.5 rounded-xl">
            <QRCodeSVG 
              id="share-qr-code"
              value={url} 
              size={260}
              level="H"
              includeMargin={false}
              fgColor="#ffffff"
              bgColor="#000000"
            />
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-md">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl border border-white/10 transition-all active:scale-95"
        >
          {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
          <span className="font-bold uppercase tracking-widest text-xs">{copied ? 'Copied' : 'Copy link'}</span>
        </button>

        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center space-x-2 bg-[#FF4500] hover:bg-[#FF4500]/80 text-white px-6 py-4 rounded-2xl border border-[#FF4500]/20 transition-all shadow-[0_0_20px_rgba(255,69,0,0.3)] active:scale-95"
        >
          <Download size={20} />
          <span className="font-bold uppercase tracking-widest text-xs">Download PNG</span>
        </button>
      </div>

      <div className="text-gray-500 text-[10px] font-mono text-center max-w-xs leading-relaxed uppercase tracking-widest">
        Scan this code to instantly access the Clear Path Markets Science terminal on any mobile device.
      </div>
    </div>
  );
}
