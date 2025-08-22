
import React, { useState, useEffect } from 'react';
import { EyeIcon, CodeIcon, CopyIcon, CheckIcon, DownloadIcon } from './icons.tsx';
import type { PreviewView } from '../types.ts';

declare global {
    interface Window {
        Prism: {
            highlightAll: () => void;
        };
    }
}

interface PreviewPanelProps {
  code: string;
  view: PreviewView;
  onViewChange: (view: PreviewView) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ code, view, onViewChange }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (view === 'source' && code) {
      // Defer highlighting to allow the DOM to update with the new code first.
      const timer = setTimeout(() => {
        if (window.Prism) {
          window.Prism.highlightAll();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [view, code]);
  
  const handleCopy = () => {
    if (isCopied || !code) return;
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
  };

  const handleSave = () => {
    if (!code) return;
    try {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Failed to save file:", err);
    }
  };

  const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
        active
          ? 'text-white'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
      {active && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)] rounded-full"></div>}
    </button>
  );

  return (
    <div className="h-full w-full flex flex-col glass rounded-l-lg overflow-hidden">
      <div className="flex-shrink-0 bg-transparent px-4 border-b border-gray-100/10">
        <nav className="flex space-x-2">
          <TabButton active={view === 'preview'} onClick={() => onViewChange('preview')}>
            <EyeIcon className="w-5 h-5" />
            Preview
          </TabButton>
          <TabButton active={view === 'source'} onClick={() => onViewChange('source')}>
            <CodeIcon className="w-5 h-5" />
            Source Code
          </TabButton>
        </nav>
      </div>
      <div className="flex-grow w-full bg-white relative">
        {view === 'preview' && (
          code ? (
            <iframe
              key={code}
              srcDoc={code}
              title="Website Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-forms allow-same-origin"
            />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/50 text-gray-500 p-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                <p className="mt-4 text-lg">Preview will appear here</p>
                <p className="text-sm">Generate a website to see it live.</p>
            </div>
          )
        )}
        {view === 'source' && (
          <div className="w-full h-full bg-black/50 overflow-auto custom-scrollbar relative">
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 glass border-none text-gray-300 hover:text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-all backdrop-blur-sm"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Save
                </button>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 glass border-none text-gray-300 hover:text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-all backdrop-blur-sm"
                    disabled={isCopied}
                >
                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap selection:bg-cyan-500/30">
              <code className="language-html">{code || '// Source code will appear here...'}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};