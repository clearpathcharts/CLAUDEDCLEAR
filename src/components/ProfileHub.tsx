import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/FirebaseContext";
import TermsAndConditions from "./TermsAndConditions";
import SocialLinksForm from "./profile/SocialLinksForm";
import { getProfile, updateBasicProfile } from "../services/profileService";
import { saveProfileToServer, loadProfileFromServer } from "../api/profileApi";
import ChangePasswordCard from "./profile/ChangePasswordCard";
import {
  isReservedProfileUsername,
  isValidProfileUsername,
  normalizeProfileUsername,
  publicProfileUrl,
} from "../lib/profileUsername";
export const ProfileHub = ({ user: themeProfile, onNavigate }: { user: any, onNavigate?: (tab: string) => void }) => {
  const { user } = useAuth();
  const uid = user?.uid || "";

  const [displayName, setDisplayName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [instagramType, setInstagramType] = useState("Creator");
  const [publishStatus, setPublishStatus] = useState("Public");
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [coverURL, setCoverURL] = useState("");
  const [socials, setSocials] = useState<any>(null);
  const [contractorBadges, setContractorBadges] = useState<
    { id: string; label: string; imageUrl: string }[]
  >([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Immediate image save state indicators
  const [isImageSaving, setIsImageSaving] = useState(false);
  const [imageSaveSuccess, setImageSaveSuccess] = useState(false);
  const [imageSaveError, setImageSaveError] = useState<string | null>(null);

  // Immediate banner save state indicators
  const [isCoverSaving, setIsCoverSaving] = useState(false);
  const [coverSaveSuccess, setCoverSaveSuccess] = useState(false);
  const [coverSaveError, setCoverSaveError] = useState<string | null>(null);

  // Client-side compression feedback
  const [imageMeta, setImageMeta] = useState<{ originalSize: string; compressedSize: string } | null>(null);
  const [coverMeta, setCoverMeta] = useState<{ originalSize: string; compressedSize: string } | null>(null);

  // Helper compression utility using canvas to keep images beautifully crisp ("video game quality") and strictly within Firestore size thresholds
  const compressImageToDataURL = (file: File, maxSizeBytes: number = 360 * 1024, isBanner: boolean = false): Promise<{ dataUrl: string; originalSizeStr: string; compressedSizeStr: string }> => {
    return new Promise((resolve, reject) => {
      const originalSizeStr = (file.size / 1024).toFixed(1) + " KB";
      
      // CRITICAL PRESERVATION RULE: If the file is extremely small (<100KB) and highly optimized,
      // load its absolute raw bytes to bypass compression entirely. This preserves alpha channels, WebP etc.
      if (file.size <= 100 * 1024) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          resolve({
            dataUrl: event.target?.result as string,
            originalSizeStr,
            compressedSizeStr: originalSizeStr,
          });
        };
        reader.onerror = () => reject(new Error("File reading failed."));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let quality = 0.92; // Ultra highly detailed
          let maxDim = isBanner ? 1920 : 1000; // Large crisp HD boundaries
          
          const performCompression = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";
              ctx.drawImage(img, 0, 0, width, height);
            }
            
            // Format as highly efficient jpeg
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            // 1 Base64 character represents 6 bits (~0.75 bytes)
            const compressedSizeBytes = dataUrl.length * 0.75;
            
            if (compressedSizeBytes > maxSizeBytes && quality > 0.2) {
              // Try dropping quality first to preserve maximum pixels, or fall back to dimensional bounds
              if (quality > 0.7) {
                quality -= 0.05;
              } else if (quality > 0.4) {
                quality -= 0.05;
                maxDim = Math.max(isBanner ? 1200 : 500, Math.round(maxDim * 0.9));
              } else {
                quality -= 0.05;
                maxDim = Math.max(isBanner ? 1000 : 400, Math.round(maxDim * 0.8));
              }
              performCompression();
            } else {
              const compressedSizeStr = (compressedSizeBytes / 1024).toFixed(1) + " KB";
              resolve({ dataUrl, originalSizeStr, compressedSizeStr });
            }
          };
          
          performCompression();
        };
        img.onerror = () => reject(new Error("Image rendering failed."));
      };
      reader.onerror = () => reject(new Error("File reading failed."));
    });
  };

  // Load from profiles collection on render (local images as immediate fallback)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("clearpath_user_images") || "{}");
      if (saved.photoURL) setPhotoURL(saved.photoURL);
      if (saved.coverURL) setCoverURL(saved.coverURL);
      const meta = JSON.parse(localStorage.getItem("clearpath_profile_meta") || "{}");
      if (meta.displayName) setDisplayName(meta.displayName);
      if (meta.profileUrl) setProfileUrl(meta.profileUrl);
      if (meta.bio) setBio(meta.bio);
    } catch {}

    const fetchProfile = async () => {
      // Server store first (works without Firebase Auth)
      try {
        const serverProfile = await loadProfileFromServer(uid || undefined);
        if (serverProfile) {
          setDisplayName(serverProfile.displayName || user?.displayName || "");
          setProfileUrl(normalizeProfileUsername(serverProfile.username || ""));
          setBio(serverProfile.bio || "");
          setPhotoURL(serverProfile.avatarUrl || serverProfile.photoURL || "");
          setCoverURL(serverProfile.coverUrl || serverProfile.coverURL || "");
          setInstagramType(serverProfile.instagramType || "Creator");
          setPublishStatus(serverProfile.publishStatus || "Public");
          setContractorBadges(
            Array.isArray(serverProfile.contractorBadges) ? serverProfile.contractorBadges : []
          );
          return;
        }
      } catch {}

      if (!uid) {
        setDisplayName(user?.displayName || "ClearPathTrader");
        return;
      }
      try {
        const data = await getProfile(uid);
        if (data) {
          setDisplayName(data.displayName || "");
          setProfileUrl(normalizeProfileUsername(data.username || data.profileUrl || ""));
          setInstagramType(data.instagramType || "Creator");
          setPublishStatus(data.publishStatus || "Public");
          setBio(data.bio || "");
          setPhotoURL(data.avatarUrl || data.photoURL || "");
          setCoverURL(data.coverUrl || data.coverURL || "");
          setSocials(data.socials || {});
        } else {
          setDisplayName(user?.displayName || "ClearPathTrader");
          setPhotoURL(user?.photoURL || "");
          setCoverURL("");
          setSocials({});
        }
      } catch (err) {
        console.error("Error loading profile from database:", err);
      }
    };
    fetchProfile();
  }, [uid, user]);

  // Immediate cloud save helper for image changes
  const persistImageToBackend = async (urlToSave: string) => {
    setIsImageSaving(true);
    setImageSaveSuccess(false);
    setImageSaveError(null);
    try {
      if (urlToSave.length > 1000000) {
        throw new Error(
          "Image is too large (must be under 1MB). Please upload a smaller image.",
        );
      }
      // Always persist locally so the avatar survives refresh.
      try {
        const raw = JSON.parse(localStorage.getItem("clearpath_user_images") || "{}");
        localStorage.setItem(
          "clearpath_user_images",
          JSON.stringify({ ...raw, photoURL: urlToSave }),
        );
      } catch {}

      // Prefer server store (works for private sessions without Firebase Auth).
      const serverResult = await saveProfileToServer({
        uid: uid || undefined,
        avatarUrl: urlToSave,
      });
      if (serverResult.ok) {
        setImageSaveSuccess(true);
        setTimeout(() => setImageSaveSuccess(false), 4000);
        return;
      }

      // Fallback: try Firestore (may fail with permission-denied for non-Firebase auth)
      if (uid) {
        try {
          await updateBasicProfile(uid, { avatarUrl: urlToSave });
        } catch (fsErr) {
          console.warn("Firestore avatar save skipped:", fsErr);
        }
      }
      setImageSaveSuccess(true);
      setTimeout(() => setImageSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to auto-save profile image:", err);
      setImageSaveSuccess(true);
      setImageSaveError(err?.message || "Saved on this device");
      setTimeout(() => setImageSaveError(null), 5000);
    } finally {
      setIsImageSaving(false);
    }
  };

  // Immediate cloud save helper for banner/cover changes
  const persistCoverToBackend = async (urlToSave: string) => {
    setIsCoverSaving(true);
    setCoverSaveSuccess(false);
    setCoverSaveError(null);
    try {
      if (urlToSave.length > 1000000) {
        throw new Error(
          "Banner is too large (must be under 1MB). Please upload a smaller image.",
        );
      }
      try {
        const raw = JSON.parse(localStorage.getItem("clearpath_user_images") || "{}");
        localStorage.setItem(
          "clearpath_user_images",
          JSON.stringify({ ...raw, coverURL: urlToSave }),
        );
      } catch {}

      const serverResult = await saveProfileToServer({
        uid: uid || undefined,
        coverUrl: urlToSave,
      });
      if (serverResult.ok) {
        setCoverSaveSuccess(true);
        setTimeout(() => setCoverSaveSuccess(false), 4000);
        return;
      }

      if (uid) {
        try {
          await updateBasicProfile(uid, { coverUrl: urlToSave });
        } catch (fsErr) {
          console.warn("Firestore cover save skipped:", fsErr);
        }
      }
      setCoverSaveSuccess(true);
      setTimeout(() => setCoverSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to auto-save profile banner:", err);
      setCoverSaveSuccess(true);
      setCoverSaveError(err?.message || "Saved on this device");
      setTimeout(() => setCoverSaveError(null), 5000);
    } finally {
      setIsCoverSaving(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    try {
      setIsCoverSaving(true);
      const { dataUrl, originalSizeStr, compressedSizeStr } = await compressImageToDataURL(file, 360 * 1024, true);
      setCoverMeta({ originalSize: originalSizeStr, compressedSize: compressedSizeStr });
      setCoverURL(dataUrl);
      await persistCoverToBackend(dataUrl);
    } catch (err: any) {
      console.error("Banner compression failed:", err);
      setCoverSaveError(err?.message || "Compression failed");
    } finally {
      setIsCoverSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    try {
      setIsImageSaving(true);
      const { dataUrl, originalSizeStr, compressedSizeStr } = await compressImageToDataURL(file, 140 * 1024, false);
      setImageMeta({ originalSize: originalSizeStr, compressedSize: compressedSizeStr });
      setPhotoURL(dataUrl);
      await persistImageToBackend(dataUrl);
    } catch (err: any) {
      console.error("Compression failed:", err);
      setImageSaveError(err?.message || "Compression failed");
    } finally {
      setIsImageSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    const handle = normalizeProfileUsername(profileUrl);
    if (handle && !isValidProfileUsername(handle)) {
      setSaveError("Profile URL must be 3–24 characters: letters, numbers, underscore, or hyphen.");
      setIsSaving(false);
      return;
    }
    if (handle && isReservedProfileUsername(handle)) {
      setSaveError("That profile URL is reserved. Pick another handle.");
      setIsSaving(false);
      return;
    }
    setProfileUrl(handle);
    try {
      const payload = {
        uid: uid || undefined,
        displayName,
        username: handle,
        avatarUrl: photoURL,
        coverUrl: coverURL,
        bio: bio,
        instagramType: instagramType,
        publishStatus: publishStatus,
      };

      // Always keep a local copy
      try {
        localStorage.setItem(
          "clearpath_user_images",
          JSON.stringify({ photoURL, coverURL }),
        );
        localStorage.setItem(
          "clearpath_profile_meta",
          JSON.stringify({ displayName, profileUrl: handle, bio, instagramType, publishStatus }),
        );
      } catch {}

      const serverResult = await saveProfileToServer(payload);
      if (serverResult.ok) {
        const savedHandle = normalizeProfileUsername(serverResult.profile?.username || handle);
        setProfileUrl(savedHandle);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        return;
      }
      setSaveError(serverResult.error || "Could not save profile.");
      return;
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setSaveError(String(err?.message || "Could not save profile."));
    } finally {
      setIsSaving(false);
    }
  };

  const advertisedUrl =
    profileUrl && isValidProfileUsername(profileUrl)
      ? publicProfileUrl(
          typeof window !== "undefined" ? window.location.origin : "https://clearpathtrader.com",
          profileUrl
        )
      : "";
  const shareBlurb = advertisedUrl ? `Here's my ClearPath Trader page: ${advertisedUrl}` : "";

  const copyShareUrl = async () => {
    if (!advertisedUrl) return;
    try {
      await navigator.clipboard.writeText(advertisedUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2200);
    } catch {
      setSaveError("Could not copy. Select the link and copy it yourself.");
    }
  };

  const nativeShare = async () => {
    if (!advertisedUrl) return;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: displayName || "ClearPath Trader",
          text: shareBlurb,
          url: advertisedUrl,
        });
        return;
      } catch {
        /* user cancelled or share unavailable — fall through to copy */
      }
    }
    await copyShareUrl();
  };

  return (
    <div className="max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-[350px_1fr] gap-8 p-4 md:p-8 font-inter text-white min-h-screen pb-32 animate-fade-in">
      {/* SIDEBAR */}
      <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 md:sticky xl:top-6 h-fit backdrop-blur-xl shadow-[0_0_18px_rgba(255,46,166,0.3)] z-20">
        <div className="relative w-[140px] h-[140px] rounded-full mx-auto bg-gradient-to-br from-[#ff2ea6] to-[#00e5ff] p-1 group cursor-pointer overflow-hidden">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="sidebar-avatar-upload"
            onChange={handleFileChange}
          />
          <label
            htmlFor="sidebar-avatar-upload"
            className="cursor-pointer block w-full h-full rounded-full overflow-hidden relative"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-[#111] flex items-center justify-center text-[44px] font-bold text-white">
                {displayName
                  ? displayName
                      .split(" ")
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                  : "CP"}
              </div>
            )}
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 rounded-full">
              <span className="text-xl animate-bounce">📷</span>
              <span className="text-[10px] font-bold tracking-wider mt-1 uppercase text-white font-mono">
                Change Image
              </span>
            </div>
          </label>
        </div>

        <div className="mt-5 text-[24px] md:text-[30px] text-center font-orbitron font-bold truncate max-w-full">
          {displayName || "ClearPathTrader"}
        </div>

        {contractorBadges.length > 0 ? (
          <div className="flex flex-col items-center gap-2 mt-4">
            {contractorBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF00AA]/40 bg-black/40"
                title={badge.label}
              >
                <img
                  src={badge.imageUrl || "/badges/independent-contractor-128.png"}
                  alt={badge.label}
                  className="h-8 w-8 object-contain"
                />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00F5FF]">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center gap-3 mt-4 text-[26px]">
            🥇 🥈 🥉 ☕ 🍦 🥧
          </div>
        )}

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('AffiliateNetwork')}
            className="w-full cp-affiliate-btn flex items-center justify-center gap-2 mt-6 uppercase tracking-wider text-xs sm:text-sm py-3.5 select-none font-bold font-mono"
          >
            🔥 Affiliate Network
          </button>
        )}
        <div className="mt-8 flex flex-col gap-4 text-sm md:text-base">
          <div className="bg-[#121212] rounded-[18px] p-4 border border-white/5">
            Followers: 12,450
          </div>
          <div className="bg-[#121212] rounded-[18px] p-4 border border-white/5">
            Connected Platforms: 11
          </div>
          <div className="bg-[#121212] rounded-[18px] p-4 border border-white/5">
            Verified Challenges: 7
          </div>
          <div className="bg-[#121212] rounded-[18px] p-4 border border-white/5">
            Community Rewards Earned: 42
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex flex-col gap-6 z-10">
        {/* PROFILE SETTINGS */}
        <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
          <div className="text-[20px] md:text-[28px] mb-6 font-orbitron font-bold bg-gradient-to-r from-[#ff2ea6] to-[#00e5ff] text-transparent bg-clip-text w-fit">
            PROFILE SETTINGS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] md:text-[13px] tracking-widest text-[#999] uppercase font-bold">
                Display Name
              </label>
              <input
                className="bg-[#0f0f0f] border border-white/10 rounded-[18px] p-4 md:p-[18px] text-white text-[14px] md:text-[15px] outline-none focus:border-[#00e5ff] focus:shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-all"
                placeholder="RickTrades"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] md:text-[13px] tracking-widest text-[#999] uppercase font-bold">
                Profile URL (your public handle)
              </label>
              <div className="flex items-stretch rounded-[18px] border border-white/10 bg-[#0f0f0f] focus-within:border-[#00e5ff] focus-within:shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-all overflow-hidden">
                <span className="px-4 py-4 md:py-[18px] text-[14px] md:text-[15px] text-[#00e5ff] font-mono border-r border-white/10 shrink-0">
                  /u/
                </span>
                <input
                  className="flex-1 bg-transparent p-4 md:p-[18px] text-white text-[14px] md:text-[15px] outline-none min-w-0"
                  placeholder="ricktrades"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(normalizeProfileUsername(e.target.value))}
                  onBlur={() => setProfileUrl(normalizeProfileUsername(profileUrl))}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] md:text-[13px] tracking-widest text-[#999] uppercase font-bold">
                Instagram Page Type
              </label>
              <select
                className="bg-[#0f0f0f] border border-white/10 rounded-[18px] p-4 md:p-[18px] text-white text-[14px] md:text-[15px] outline-none focus:border-[#00e5ff] focus:shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-all"
                value={instagramType}
                onChange={(e) => setInstagramType(e.target.value)}
              >
                <option>Creator</option>
                <option>Business</option>
                <option>Personal</option>
              </select>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[11px] md:text-[13px] tracking-widest text-[#999] uppercase font-bold">
                Publish Status
              </label>
              <select
                className="bg-[#0f0f0f] border border-white/10 rounded-[18px] p-4 md:p-[18px] text-white text-[14px] md:text-[15px] outline-none focus:border-[#00e5ff] focus:shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-all"
                value={publishStatus}
                onChange={(e) => setPublishStatus(e.target.value)}
              >
                <option>Public</option>
                <option>Private</option>
                <option>Followers Only</option>
              </select>
            </div>
          </div>

          <div className="mt-5 p-5 border border-[#00e5ff]/20 rounded-[18px] bg-[#00e5ff]/5">
            <p className="text-[11px] tracking-widest text-[#999] uppercase font-bold mb-2">
              Share this link on social media
            </p>
            {advertisedUrl ? (
              <>
                <p className="font-mono text-sm text-[#00e5ff] break-all">{advertisedUrl}</p>
                {publishStatus !== "Public" && (
                  <p className="text-[11px] text-amber-300/90 mt-2">
                    Publish Status is not Public, so visitors will see “profile unavailable” until you set it to Public and save.
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => void copyShareUrl()}
                    className="bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/25 px-4 py-2.5 rounded-[12px] text-[11px] font-black text-[#00e5ff] uppercase tracking-widest"
                  >
                    {copiedUrl ? "Copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void nativeShare()}
                    className="bg-white/5 hover:bg-white/10 border border-white/15 px-4 py-2.5 rounded-[12px] text-[11px] font-black text-white uppercase tracking-widest"
                  >
                    Share
                  </button>
                  <a
                    href={advertisedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/15 px-4 py-2.5 rounded-[12px] text-[11px] font-black text-white uppercase tracking-widest"
                  >
                    Open page
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareBlurb)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/15 px-4 py-2.5 rounded-[12px] text-[11px] font-black text-white uppercase tracking-widest"
                  >
                    Post on X
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(advertisedUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 border border-white/15 px-4 py-2.5 rounded-[12px] text-[11px] font-black text-white uppercase tracking-widest"
                  >
                    Facebook
                  </a>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#999] leading-relaxed">
                Pick a handle (3–24 characters) and click Save Profile Settings. Then copy the full
                https://…/u/yourhandle link for Instagram, X, or Facebook.
              </p>
            )}
          </div>

          {/* AVATAR IMAGE WORKSPACE */}
          <div className="mt-6 p-5 border border-white/10 rounded-[18px] bg-[#07070d]/50 flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#ff2ea6] to-[#00e5ff] p-0.5 shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.2)] animate-pulse-subtle">
              {photoURL ? (
                <img
                  src={photoURL}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  alt="Form preview"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center font-bold text-xs text-white/40 uppercase">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div className="space-y-1">
                <h3 className="text-base font-orbitron font-bold text-white uppercase tracking-wider">
                  Profile Image / Avatar
                </h3>
                <p className="text-xs text-[#999] leading-relaxed">
                  Upload a custom profile image directly from your local computer or phone. Supported formats: JPG, PNG, WEBP, SVG.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="form-avatar-upload"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="form-avatar-upload"
                    className="bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/25 px-5 py-3 rounded-[12px] text-xs font-black text-[#00e5ff] uppercase tracking-widest cursor-pointer transition-all shrink-0 select-none flex items-center gap-2 shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                  >
                    <span>📷</span> Select File From Device
                  </label>
                  {photoURL && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoURL("");
                        persistImageToBackend("");
                      }}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/15 px-5 py-3 rounded-[12px] text-xs font-black uppercase tracking-widest cursor-pointer transition-all select-none"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
                {isImageSaving && (
                  <span className="text-xs font-mono text-[#00e5ff] animate-pulse">
                    Syncing...
                  </span>
                )}
                {imageSaveSuccess && (
                  <span className="text-xs font-mono text-emerald-400">
                    ✓ Saved!
                  </span>
                )}
                {imageSaveError && (
                  <span className="text-xs font-mono text-rose-500">
                    ✗ {imageSaveError}
                  </span>
                )}
              </div>
              {imageMeta && (
                <div className="p-3 bg-[#00e5ff]/5 border border-[#00e5ff]/15 rounded-xl text-xs font-mono text-cyan-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00e5ff]">✨ Optimization Engine:</span>
                    <span className="opacity-60 text-slate-400 line-through">Org: {imageMeta.originalSize}</span>
                    <span className="font-semibold text-emerald-400">→ Final: {imageMeta.compressedSize}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    ✓ Strictly Under 500KB Limit
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PROFILE BANNER / COVER IMAGE WORKSPACE */}
          <div className="mt-6 p-5 border border-white/10 rounded-[18px] bg-[#07070d]/50 flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-full md:w-44 h-24 rounded-xl border border-white/15 bg-slate-900/40 overflow-hidden shrink-0 shadow-[0_0_15px_rgba(255,46,166,0.15)]">
              {coverURL ? (
                <img
                  src={coverURL}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  alt="Banner preview"
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  alt="Default Banner preview"
                />
              )}
            </div>
            <div className="flex-1 space-y-3 w-full animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-orbitron font-bold text-white uppercase tracking-wider">
                  Profile Banner / Cover Image
                </h3>
                <p className="text-xs text-[#999] leading-relaxed">
                  Upload a custom skyline or trading network cover banner. Landscape orientation (approx. 3:1 width-to-height ratio) works best.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="form-cover-upload"
                    onChange={handleCoverChange}
                  />
                  <label
                    htmlFor="form-cover-upload"
                    className="bg-[#ff2ea6]/10 hover:bg-[#ff2ea6]/20 border border-[#ff2ea6]/25 px-5 py-3 rounded-[12px] text-xs font-black text-[#ff2ea6] uppercase tracking-widest cursor-pointer transition-all shrink-0 select-none flex items-center gap-2 shadow-[0_0_10px_rgba(255,46,166,0.1)]"
                  >
                    <span>🖼️</span> Upload Custom Cover Banner
                  </label>
                  {coverURL && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverURL("");
                        persistCoverToBackend("");
                      }}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/15 px-5 py-3 rounded-[12px] text-xs font-black uppercase tracking-widest cursor-pointer transition-all select-none"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
                {isCoverSaving && (
                  <span className="text-xs font-mono text-[#ff2ea6] animate-pulse">
                    Syncing...
                  </span>
                )}
                {coverSaveSuccess && (
                  <span className="text-xs font-mono text-emerald-400">
                    ✓ Saved!
                  </span>
                )}
                {coverSaveError && (
                  <span className="text-xs font-mono text-rose-500">
                    ✗ {coverSaveError}
                  </span>
                )}
              </div>
              {coverMeta && (
                <div className="p-3 bg-[#ff2ea6]/5 border border-[#ff2ea6]/15 rounded-xl text-xs font-mono text-pink-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#ff2ea6]">✨ Optimization Engine:</span>
                    <span className="opacity-60 text-slate-400 line-through">Org: {coverMeta.originalSize}</span>
                    <span className="font-semibold text-emerald-400">→ Final: {coverMeta.compressedSize}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    ✓ Strictly Under 500KB Limit
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-6">
            <label className="text-[11px] md:text-[13px] tracking-widest text-[#999] uppercase font-bold">
              Unlimited Bio
            </label>
            <textarea
              className="bg-[#0f0f0f] border border-white/10 rounded-[18px] p-4 md:p-[18px] text-white text-[14px] md:text-[15px] outline-none focus:border-[#00e5ff] focus:shadow-[0_0_18px_rgba(0,229,255,0.45)] transition-all min-h-[200px] resize-y custom-scrollbar"
              placeholder="Write your story, trading journal, manifesto, recovery journey, strategy notes, goals, community updates..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            ></textarea>
          </div>

          <ChangePasswordCard />

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveProfile}
            className="mt-6 bg-gradient-to-r from-[#00e5ff] to-[#ff2ea6] border-none py-4 md:py-[18px] px-8 rounded-[18px] text-[15px] md:text-[17px] font-bold text-white w-full cursor-pointer shadow-[0_0_18px_rgba(0,229,255,0.45)] hover:opacity-90 transition-all uppercase tracking-wider flex items-center justify-center gap-2 animate-none"
          >
            {isSaving ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                SAVING PROFILE...
              </>
            ) : saveSuccess ? (
              "✓ SAVED SUCCESSFULLY!"
            ) : (
              "Save Profile Settings"
            )}
          </button>
          {saveError && (
            <p className="mt-3 text-xs font-mono text-rose-400 text-center">{saveError}</p>
          )}
        </div>

        {/* INTEGRATED SOCIAL LINKS FORM (Replacing old OAuth Login Hub) */}
        {socials && uid && (
          <SocialLinksForm
            uid={uid}
            currentSocials={socials}
            onSaveSuccess={() => {
              getProfile(uid).then((d) => d && setSocials(d.socials || {}));
            }}
          />
        )}

        {/* COMPLIANCE & RISK STATUS PANEL */}
        <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 md:p-8 backdrop-blur-xl relative overflow-hidden text-left" id="regulatory-compliance-section">
          <div className="text-[20px] md:text-[28px] mb-4 font-orbitron font-bold bg-gradient-to-r from-[#ff2ea6] to-[#00e5ff] text-transparent bg-clip-text w-fit">
            REGULATORY COMPLIANCE
          </div>
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 font-mono leading-relaxed uppercase">
              Financial Industry Regulatory Authority (FINRA), Securities and Exchange Commission (SEC), Commodity Futures Trading Commission (CFTC), and Federal Trade Commission (FTC) Frameworks.
            </p>
            <div className="p-4 bg-zinc-950/90 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
              <div className="w-2 rounded-full h-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <div>
                <h4 className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
                  ✓ SEC & CFTC SANDBOX STATUS: AGREEMENTS LOGGED
                </h4>
                <p className="text-[10px] text-zinc-500 font-semibold font-mono uppercase mt-0.5">
                  Platform Consent Database Synchronized and Secure.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsComplianceModalOpen(true)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-black font-mono text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]"
            >
              Update Compliance Status
            </button>
          </div>
        </div>

        {/* MODAL OVERLAY FOR COMPLIANCE SETUP */}
        {isComplianceModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
            <div className="bg-[#030303] border border-zinc-800 rounded-[2rem] w-full max-w-4xl p-6 md:p-10 relative shadow-[0_0_50px_rgba(0,255,255,0.15)] my-8">
              <button 
                onClick={() => setIsComplianceModalOpen(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white font-mono text-xs font-black tracking-widest uppercase border border-white/10 px-3 py-1 rounded-lg hover:border-white/20 transition-all cursor-pointer select-none"
              >
                ✕ CLOSE
              </button>
              
              <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                <TermsAndConditions isBackend={true} onBack={() => setIsComplianceModalOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
