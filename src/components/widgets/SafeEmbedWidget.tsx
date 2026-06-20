import React, { useState } from 'react';

export const SafeEmbedWidget = ({ config }: any) => {
  const [embedCode, setEmbedCode] = useState(config?.url || config?.embed || '');
  const [isEditing, setIsEditing] = useState(!embedCode);
  const [inputVal, setInputVal] = useState('');
  
  const platform = config?.platform || 'custom';

  const handleSave = () => {
    if (inputVal.trim()) {
      let finalCode = inputVal;
      
      if (finalCode.includes('src="youtube.com"') || finalCode.includes('src="https://youtube.com"')) {
        finalCode = finalCode.replace('youtube.com', 'youtube-nocookie.com');
      }

      setEmbedCode(finalCode);
      setIsEditing(false);
    }
  };

  const isIframeCode = embedCode.trim().startsWith('<iframe');
  const isBlockquoteCode = embedCode.trim().startsWith('<blockquote');

  return (
    <div className="w-full h-full bg-[#111] overflow-hidden flex flex-col group p-2">
      {isEditing ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-black border border-dashed border-[#333] rounded-lg p-4 overflow-y-auto custom-scrollbar">
          <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center mb-4 shrink-0">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="rgba(255,43,214,1)" strokeWidth="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 text-center shrink-0">
            {config?.title || 'Sandboxed Embed'}
            <span className="text-[10px] text-gray-500 font-normal mt-1 block normal-case">
              Paste {platform} URL or Embed Code
            </span>
          </div>
          <div className="w-full max-w-sm flex flex-col gap-2 pointer-events-auto shrink-0">
            <textarea 
               className="w-full h-24 bg-[#111] border border-[#333] rounded p-3 text-white font-mono text-xs outline-none focus:border-[rgba(255,43,214,0.8)] resize-none"
               placeholder={`e.g. <iframe ...></iframe> or https://...`}
               value={inputVal}
               onChange={e => setInputVal(e.target.value)}
            />
            <button 
              onClick={handleSave}
              className="w-full py-2 bg-[rgba(255,43,214,0.2)] hover:bg-[rgba(255,43,214,0.4)] text-[rgba(255,43,214,1)] font-bold tracking-widest uppercase text-xs rounded transition-colors"
            >
              Load Widget
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative bg-black rounded-lg overflow-hidden border border-[#222] group-hover:border-[#333] transition-colors pointer-events-auto">
          {isBlockquoteCode || isIframeCode ? (
             <iframe 
               srcDoc={`
                 <!DOCTYPE html>
                 <html>
                   <head>
                     <meta charset="utf-8">
                     <meta name="viewport" content="width=device-width, initial-scale=1">
                     <style>
                       body { margin: 0; padding: 0; display: flex; justify-content: center; background: transparent; color: white; color-scheme: dark; font-family: sans-serif; }
                       /* Fix common embeds to fill container */
                       iframe { max-width: 100%; border: none; }
                       blockquote { margin: 0; padding: 0; }
                     </style>
                   </head>
                   <body>
                     ${embedCode}
                   </body>
                 </html>
               `}
               className="w-full h-full border-0 pointer-events-auto" 
               allowFullScreen
               sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
             />
          ) : embedCode ? (
            <iframe 
               src={embedCode} 
               className="w-full h-full border-0 pointer-events-auto" 
               allowFullScreen
               sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
             />
          ) : null}
          <div className="absolute top-2 right-2 flex gap-2">
            <button 
                onClick={() => setIsEditing(true)}
                className="w-8 h-8 rounded-full bg-black/80 text-gray-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              </button>
            <div className="w-8 h-8 rounded-full bg-[rgba(255,43,214,0.2)] flex items-center justify-center backdrop-blur text-[rgba(255,43,214,1)]">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
