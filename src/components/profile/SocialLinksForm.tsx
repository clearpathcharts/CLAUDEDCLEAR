import React, { useState, useEffect } from "react";
import { updateSocials } from "../../services/profileService";

interface Props {
  uid: string;
  currentSocials: any;
  onSaveSuccess?: () => void;
}

export default function SocialLinksForm({
  uid,
  currentSocials,
  onSaveSuccess
}: Props) {
  const [socials, setSocials] = useState<Record<string, string>>(
    currentSocials || {}
  );

  useEffect(() => {
    if (currentSocials) {
      setSocials(currentSocials);
    }
  }, [currentSocials]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (
    key: string,
    value: string
  ) => {
    setSocials({
      ...socials,
      [key]: value
    });
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  const saveSocials = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updateSocials(uid, socials);
      setSaveStatus('success');
      if (onSaveSuccess) onSaveSuccess();
      setTimeout(() => setSaveStatus('idle'), 4000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const fields = [
    "website",
    "youtube",
    "instagram",
    "tiktok",
    "facebook",
    "twitter",
    "discord",
    "telegram",
    "linkedin",
    "twitch",
    "pinterest"
  ];

  return (
    <div className="space-y-5 bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-xl">
      <div className="flex justify-between items-center">
        <h2 className="text-[20px] md:text-[24px] font-orbitron font-bold bg-gradient-to-r from-[#ff2ea6] to-[#00e5ff] text-transparent bg-clip-text">
          CONNECTED SOCIALS
        </h2>
        {saveStatus === 'success' && (
          <span className="text-xs font-mono text-[#00ff99] animate-pulse">
            ✓ SAVED SUCCESSFULLY
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs font-mono text-rose-500 animate-pulse">
            ✗ SAVE FAILED
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field} className="flex flex-col gap-2">
            <label className="text-[11px] tracking-widest text-[#999] uppercase font-bold">
              {field === "twitter" ? "X.COM URL" : `${field} URL`}
            </label>
            <input
              type="text"
              value={socials[field] || ""}
              onChange={(e) =>
                handleChange(field, e.target.value)
              }
              placeholder={
                field === "twitter"
                  ? "https://x.com/username"
                  : `https://${field}.com/username`
              }
              className="
                w-full
                bg-[#0f0f0f]
                border
                border-white/10
                rounded-[18px]
                p-4
                text-white
                text-[14px]
                outline-none
                focus:border-[#ff2ea6]
                focus:shadow-[0_0_12px_rgba(255,46,166,0.25)]
                transition-all
              "
            />
          </div>
        ))}
      </div>

      <button
        onClick={saveSocials}
        disabled={isSaving}
        className="
          w-full
          mt-4
          bg-gradient-to-r
          from-[#ff2ea6]
          to-[#9c4dff]
          hover:opacity-90
          disabled:opacity-55
          p-4
          rounded-[18px]
          text-white
          font-bold
          transition-all
          uppercase
          tracking-wider
          text-sm
          shadow-[0_0_15px_rgba(255,46,166,0.3)]
        "
      >
        {isSaving ? "Saving Social Links..." : "Save Social Links"}
      </button>
    </div>
  );
}
