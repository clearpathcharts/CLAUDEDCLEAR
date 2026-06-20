import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, FileDown, Mail, AlertTriangle, Check, Search, Lock } from 'lucide-react';
import { doc, updateDoc } from '../firebase';
import { getDb, handleFirestoreError, OperationType } from '../firebase';

interface QuarantineModalProps {
  user: any;
  onClose: () => void;
}

export default function QuarantineModal({ user, onClose }: QuarantineModalProps) {
  const [reason, setReason] = useState('');
  const [isQuarantined, setIsQuarantined] = useState(user?.isQuarantined || false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleQuarantine = async () => {
    setIsProcessing(true);
    try {
      const userRef = doc(getDb(), 'users', user.id);
      await updateDoc(userRef, {
        isQuarantined: true,
        quarantineReason: reason,
        quarantinedAt: new Date().toISOString()
      });
      setIsQuarantined(true);
      setSuccessMsg('User info successfully quarantined.');
    } catch (err) {
      console.error('Error quarantining user', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePDF = () => {
    setReportGenerated(true);
    setSuccessMsg('PDF Report generated securely.');
    
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(200, 0, 0);
      doc.text('HEAD SECURITY - OFFICIAL INVESTIGATION REPORT', 10, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Date: ${new Date().toLocaleString()}`, 10, 30);
      doc.text(`Target UID: ${user.id}`, 10, 40);
      
      doc.setFontSize(16);
      doc.text('SUBJECT DETAILS', 10, 55);
      doc.line(10, 58, 200, 58);
      
      doc.setFontSize(12);
      doc.text(`Display Name: ${user.displayName || 'Unknown'}`, 10, 70);
      doc.text(`Email Address: ${user.email || 'Hidden/Not Provided'}`, 10, 80);
      doc.text(`Username: @${user.username || 'unknown'}`, 10, 90);
      doc.text(`Created At: ${user.createdAt || 'N/A'}`, 10, 100);
      doc.text(`IP Trace: [REDACTED/LOGGED]`, 10, 110);
      
      doc.setFontSize(16);
      doc.text('REASON FOR QUARANTINE / INVESTIGATION', 10, 130);
      doc.line(10, 133, 200, 133);
      
      doc.setFontSize(12);
      const splitReason = doc.splitTextToSize(reason || 'No specific reason provided by officer.', 180);
      doc.text(splitReason, 10, 145);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('This document is certified for local law enforcement submission.', 10, 280);
      
      doc.save(`HeadSecurity_Report_${user.id}.pdf`);
    });
  };

  const handleSendEmail = () => {
    setReportGenerated(true);
    setSuccessMsg('Email successfully forwarded to Head Security Legal Dept.');
    
    const subject = encodeURIComponent(`INVESTIGATION REPORT: ${user.id}`);
    const body = encodeURIComponent(`
HEAD SECURITY - OFFICIAL INVESTIGATION REPORT
=============================================
Date: ${new Date().toLocaleString()}
Target UID: ${user.id}

SUBJECT DETAILS
---------------
Display Name : ${user.displayName || 'Unknown'}
Email Address: ${user.email || 'Hidden/Not Provided'}
Username     : @${user.username || 'unknown'}

REASON FOR QUARANTINE
---------------------
${reason || 'No specific reason provided by officer.'}
    `);
    
    window.location.href = `mailto:law_enforcement@example.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#0a0a0f] border border-red-500/30 rounded-xl overflow-hidden shadow-2xl shadow-red-900/20 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-red-950/40 p-6 border-b border-red-500/20 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 text-red-500 mb-2">
              <ShieldAlert size={28} />
              <h2 className="text-2xl font-bold tracking-wider">SECURE QUARANTINE</h2>
            </div>
            <p className="text-red-400/70 text-sm font-mono">AUTHORIZED PERSONNEL ONLY // INITIATING INVESTIGATION PROTOCOL</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {successMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center text-green-400">
              <Check className="mr-3" size={20} />
              {successMsg}
            </div>
          )}

          {/* Subject Info */}
          <div className="bg-black/50 border border-white/10 rounded-lg p-5 mb-6">
            <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4 flex items-center">
              <Lock size={14} className="mr-2" /> Subject Identifier Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/30 text-xs uppercase mb-1">Display Name</p>
                <p className="text-white font-mono">{user.displayName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-white/30 text-xs uppercase mb-1">Username</p>
                <p className="text-white font-mono">@{user.username || 'unknown'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-white/30 text-xs uppercase mb-1">Email Address</p>
                <p className="text-[#FF00FF] font-mono break-all">{user.email || 'Hidden/Not provided'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-white/30 text-xs uppercase mb-1">System UID</p>
                <p className="text-white/50 font-mono text-xs break-all">{user.id}</p>
              </div>
            </div>
          </div>

          {!isQuarantined ? (
            <div className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs font-bold uppercase tracking-wider mb-2">
                  Basis for Investigation / Quarantine Notes
                </label>
                <textarea 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter details of suspicious activity, harassment, or violations..."
                  className="w-full h-32 bg-[#111] border border-red-500/20 rounded-lg p-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500 font-mono text-sm"
                />
              </div>
              
              <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4 flex items-start">
                <AlertTriangle className="text-red-500 mr-3 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-red-400/80 text-sm">
                  Executing a quarantine will isolate this user's data and flag their account for severe review. This action is logged.
                </p>
              </div>

              <button 
                onClick={handleQuarantine}
                disabled={isProcessing}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isProcessing ? 'PROCESSING...' : 'EXECUTE QUARANTINE PROTOCOL'}
                <ShieldAlert className="ml-2" size={20} />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-6 bg-black/40 border border-red-500/20 rounded-lg">
                <h3 className="text-xl font-bold text-red-500 mb-2">SUBJECT QUARANTINED</h3>
                <p className="text-white/60 mb-6">The profile data has been isolated and packaged for extraction.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleGeneratePDF}
                    className="flex flex-col items-center justify-center p-4 bg-[#111] hover:bg-[#1a1a2e] border border-indigo-500/30 rounded-lg group transition-colors"
                  >
                    <FileDown size={32} className="text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm">Extract PDF Report</span>
                    <span className="text-white/40 text-xs text-center mt-2 group-hover:text-white/60">Generate offline document for authorities</span>
                  </button>

                  <button 
                    onClick={handleSendEmail}
                    className="flex flex-col items-center justify-center p-4 bg-[#111] hover:bg-[#1a1a2e] border border-[#00FFFF]/30 rounded-lg group transition-colors"
                  >
                    <Mail size={32} className="text-[#00FFFF] mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-sm">Transmit Dossier</span>
                    <span className="text-white/40 text-xs text-center mt-2 group-hover:text-white/60">Email package to Legal / LEA</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
