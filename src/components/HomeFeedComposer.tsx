import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Mic, Radio, Link as LinkIcon, Send, Image as ImageIcon, MessageSquare, X, User } from 'lucide-react';
import { useAuth } from '../contexts/FirebaseContext';

interface HomeFeedComposerProps {
  profile: any;
}

export default function HomeFeedComposer({ profile }: HomeFeedComposerProps) {
  const { userProfile, createPost } = useAuth();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [activeMedia, setActiveMedia] = useState<'none' | 'video' | 'audio' | 'live' | 'meeting' | 'photo'>('none');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [liveReady, setLiveReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposerError(null);

    if (!content.trim() && activeMedia === 'none' && !attachedFile && !audioBlob && !meetingUrl && !liveReady) return;
    
    setIsPosting(true);
    try {
      let finalContent = content;
      let mediaData: { url: string; type: 'image' | 'video' } | undefined = undefined;

      if (activeMedia === 'video' && attachedFile) finalContent += '\n\n[🎥 Video Attached: ' + attachedFile.name + ']';
      if (activeMedia === 'audio' && audioBlob) finalContent += '\n\n[🎤 Audio Intel Attached]';
      if (activeMedia === 'live' && liveReady) finalContent += '\n\n🔴 Live Broadcast Pending';
      if (activeMedia === 'meeting' && meetingUrl) finalContent += `\n\n🔗 Meeting Link: ${meetingUrl}`;

      if (activeMedia === 'photo' && attachedFile) {
        const reader = new FileReader();
        const base64Url = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(attachedFile);
        });
        
        let finalBase64 = base64Url;
        if (base64Url.length > 200000) {
          finalBase64 = await new Promise<string>((resolve) => {
            const img = new Image();
            img.src = base64Url;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const maxWidth = 1600;
              let width = img.width;
              let height = img.height;
              if (width > maxWidth) {
                 height = (maxWidth / width) * height;
                 width = maxWidth;
              }
              canvas.width = width;
              canvas.height = height;
              if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.90));
              } else {
                resolve(base64Url);
              }
            };
            img.onerror = () => resolve(base64Url);
          });
        }
        mediaData = { url: finalBase64, type: 'image' };
      }

      const visibilityStr = isPrivate ? 'PRIVATE' : 'GLOBAL';
      await createPost(finalContent, mediaData, visibilityStr);
      
      setContent('');
      setIsExpanded(false);
      setActiveMedia('none');
      setIsPrivate(false);
      setAttachedFile(null);
      setMeetingUrl('');
      setAudioBlob(null);
      setLiveReady(false);
    } catch (err) {
      console.error(err);
    }
    setIsPosting(false);
  };

  return (
    <div 
      className="mb-10 rounded-2xl glass border overflow-hidden transition-all duration-500"
      style={{ 
        borderColor: isExpanded ? profile.borderA : 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.4)',
        boxShadow: isExpanded ? `0 0 30px ${profile.borderA}22` : 'none'
      }}
    >
      <form onSubmit={handleSubmit}>
        <div className="p-4 flex gap-4">
          <div className="w-12 h-12 rounded-full shrink-0 border-2 overflow-hidden flex items-center justify-center bg-black/50" style={{ borderColor: profile.borderA }}>
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} referrerPolicy="no-referrer" alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-white/50" />
            )}
          </div>
          
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setComposerError(null);
              }}
              onFocus={() => setIsExpanded(true)}
              placeholder="Post an operational update, share charts, or broadcast live..."
              className="w-full bg-transparent border-none text-white resize-none focus:outline-none placeholder:text-white/30 text-lg min-h-[50px] transition-all"
              style={{ height: isExpanded ? '100px' : '50px' }}
            />
            
            {composerError && (
              <div className="text-red-500 font-mono text-xs my-2 p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl">
                ⚠️ {composerError}
              </div>
            )}
            
            <AnimatePresence>
              {activeMedia !== 'none' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 mb-2 p-4 rounded-xl relative overflow-hidden"
                  style={{ backgroundColor: `${profile.borderA}11`, border: `1px solid ${profile.borderA}33` }}
                >
                  <button 
                    type="button"
                    onClick={() => setActiveMedia('none')} 
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black rounded-full text-white transition-colors z-10"
                  >
                    <X size={14} />
                  </button>
                  
                  {activeMedia === 'photo' && (
                    <div className="flex flex-col items-center justify-center py-6 text-white/70">
                      <ImageIcon size={32} className="mb-2" style={{ color: profile.borderA }} />
                      <p className="text-sm font-black uppercase tracking-widest">{attachedFile ? attachedFile.name : 'Attach Photo'}</p>
                      <button type="button" onClick={() => document.getElementById('image-upload')?.click()} className="mt-4 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold uppercase transition-colors">
                        {attachedFile ? 'Change Photo' : 'Browse'}
                      </button>
                    </div>
                  )}
                  {activeMedia === 'video' && (
                    <div className="flex flex-col items-center justify-center py-6 text-white/70">
                      <Video size={32} className="mb-2" style={{ color: profile.borderA }} />
                      <p className="text-sm font-black uppercase tracking-widest">{attachedFile ? attachedFile.name : 'Attach Video File'}</p>
                      <button type="button" onClick={() => document.getElementById('video-upload')?.click()} className="mt-4 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold uppercase transition-colors">
                        {attachedFile ? 'Change File' : 'Browse'}
                      </button>
                      <input 
                        type="file" 
                        id="video-upload" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => { 
                          if (e.target.files && e.target.files.length > 0) {
                            setAttachedFile(e.target.files[0]);
                          }
                        }} 
                      />
                    </div>
                  )}
                  {activeMedia === 'audio' && (
                    <div className="flex flex-col items-center justify-center py-6 text-white/70">
                      <Mic size={32} className="mb-2" style={{ color: profile.borderA }} />
                      <p className="text-sm font-black uppercase tracking-widest">
                        {audioBlob ? 'Audio Recorded and Ready' : (isRecording ? 'Recording in progress...' : 'Record Audio Intel')}
                      </p>
                      {!audioBlob && (
                        <button 
                          type="button"
                          onClick={() => {
                            if (isRecording) {
                              setIsRecording(false);
                              setAudioBlob(new Blob(['mock data'], { type: 'audio/webm' }));
                            } else {
                              setIsRecording(true);
                            }
                          }}
                          className={`mt-4 px-6 py-2 rounded-lg ${isRecording ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white'} text-xs font-bold uppercase transition-colors flex items-center gap-2`}
                        >
                          {isRecording ? (
                            <>Stop Recording</>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-current "></div>
                              Start Recording
                            </>
                          )}
                        </button>
                      )}
                      {audioBlob && (
                         <button type="button" onClick={() => setAudioBlob(null)} className="mt-4 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold uppercase transition-colors text-white">
                           Discard Audio
                         </button>
                      )}
                    </div>
                  )}
                  {activeMedia === 'live' && (
                    <div className="flex flex-col items-center justify-center py-6 text-white/70">
                      <Radio size={32} className={`mb-2 ${liveReady ? 'text-red-500 ' : 'text-white/50'}`} />
                      <p className="text-sm font-black uppercase tracking-widest">
                        {liveReady ? 'Stream Engine Ready' : 'Initiate Live Broadcast'}
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setLiveReady(!liveReady)}
                        className={`mt-4 px-8 py-3 rounded-lg ${liveReady ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white'} text-xs font-black uppercase tracking-widest transition-colors`}
                      >
                        {liveReady ? 'Engine Activated' : 'Go Live Now'}
                      </button>
                    </div>
                  )}
                  {activeMedia === 'meeting' && (
                    <div className="flex flex-col items-center justify-center py-6 text-white/70">
                      <LinkIcon size={32} className="mb-2 text-blue-500" />
                      <p className="text-sm font-black uppercase tracking-widest">Attach Zoom / Teams Link</p>
                      <input 
                        type="url" 
                        placeholder="Paste meeting URL..." 
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        className="mt-4 w-full max-w-md bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 mt-3 border-t border-white/10 gap-4">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <MediaButton 
                  icon={ImageIcon} 
                  label="Photo" 
                  onClick={() => { setActiveMedia(activeMedia === 'photo' ? 'none' : 'photo'); setIsExpanded(true); }} 
                  color={profile.borderA} 
                  active={activeMedia === 'photo'}
                />
                <input 
                  type="file" 
                  id="image-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => { 
                    if (e.target.files && e.target.files.length > 0) {
                      setAttachedFile(e.target.files[0]);
                      setActiveMedia('photo');
                      setIsExpanded(true);
                    }
                  }} 
                />
                
                <MediaButton 
                  icon={Video} 
                  label="Video" 
                  onClick={() => { setActiveMedia(activeMedia === 'video' ? 'none' : 'video'); setIsExpanded(true); }} 
                  color="#3b82f6" 
                  active={activeMedia === 'video'}
                />
                <MediaButton 
                  icon={Mic} 
                  label="Audio" 
                  onClick={() => { setActiveMedia(activeMedia === 'audio' ? 'none' : 'audio'); setIsExpanded(true); }} 
                  color="#10b981" 
                  active={activeMedia === 'audio'}
                />
                <MediaButton 
                  icon={Radio} 
                  label="Live" 
                  onClick={() => { setActiveMedia(activeMedia === 'live' ? 'none' : 'live'); setIsExpanded(true); }} 
                  color="#ef4444" 
                  active={activeMedia === 'live'}
                />
                <MediaButton 
                  icon={LinkIcon} 
                  label="Zoom / Teams" 
                  onClick={() => { setActiveMedia(activeMedia === 'meeting' ? 'none' : 'meeting'); setIsExpanded(true); }} 
                  color="#8b5cf6" 
                  active={activeMedia === 'meeting'}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white/50 hover:text-white uppercase">
                   <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="accent-[#FF4500]" /> Private Group Only
                </label>
                {(isExpanded || content || activeMedia !== 'none') && (
                  <>
                    <button 
                      type="button" 
                      onClick={() => { 
                        setIsExpanded(false); 
                        setActiveMedia('none'); 
                        setContent(''); 
                        setIsPrivate(false); 
                        setLiveReady(false); 
                        setAudioBlob(null); 
                        setAttachedFile(null); 
                        setMeetingUrl(''); 
                        setComposerError(null);
                      }}
                      className="text-white/50 hover:text-white text-xs font-bold uppercase transition-colors ml-2"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isPosting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-black font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,69,0,0.3)] min-w-[120px] justify-center disabled:opacity-50 disabled:hover:scale-100"
                      style={{ background: `linear-gradient(to right, ${profile.borderA}, ${profile.borderA}dd)` }}
                    >
                      <Send size={14} />
                      {isPosting ? 'Sending...' : 'Transmit'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function MediaButton({ icon: Icon, label, onClick, color, active = false }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors ${active ? 'bg-white/10' : ''}`}
    >
      <Icon size={16} style={{ color }} />
      <span className="hidden sm:inline text-xs font-bold text-white/70">{label}</span>
    </button>
  );
}
