import React, { useEffect, useState } from 'react';

interface EasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
  signature: string;
}

const EasterEggModal: React.FC<EasterEggModalProps> = ({ isOpen, onClose, signature }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      setTimeout(() => setShow(false), 300);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Card */}
      <div className={`relative bg-gradient-to-br from-gray-900 to-black text-green-400 p-8 rounded-2xl shadow-2xl border border-green-500/30 max-w-md w-full transform transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-green-500/20 blur-xl rounded-2xl -z-10"></div>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <span className="material-icons text-3xl text-green-400">code</span>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 tracking-wider text-white">SYSTEM UNLOCKED</h2>
          <p className="text-sm text-green-500/70 mb-6 uppercase tracking-widest">Secret Protocol Initiated</p>
          
          <div className="bg-black/50 rounded-lg p-4 mb-8 border border-green-900/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <code className="font-mono text-lg text-green-300 break-all select-all">
              {signature}
            </code>
          </div>

          <button 
            onClick={onClose}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/20"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
};

export default EasterEggModal;
