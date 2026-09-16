import {
  doc,
  getDoc,
  setDoc
} from '../firebase';

import { getDb, handleFirestoreError, OperationType } from "../firebase";

export const createEmptyProfile = async (uid: string): Promise<void> => {
  const profileRef = doc(getDb(), "profiles", uid);
  const socialsRef = doc(getDb(), "profiles", uid, "socials", "links");
  try {
    console.log(`[createEmptyProfile] Writing initial profile document at profiles/${uid}...`);
    const defaultProfile = {
      uid,
      displayName: "",
      avatarUrl: "",
      bio: "",
    };
    await setDoc(profileRef, defaultProfile);
    console.log(`[createEmptyProfile] Successfully created initial profile at profiles/${uid}`);

    console.log(`[createEmptyProfile] Writing initial social document at profiles/${uid}/socials/links...`);
    const defaultSocials = {
      youtube: "",
      instagram: "",
      tiktok: "",
      facebook: "",
      twitter: "",
      discord: "",
      telegram: "",
      linkedin: "",
      twitch: "",
      pinterest: "",
      website: ""
    };
    await setDoc(socialsRef, defaultSocials);
    console.log(`[createEmptyProfile] Successfully created initial socials subdocument`);
  } catch (error) {
    console.error(`[createEmptyProfile] Error creating initial profile for profiles/${uid}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `profiles/${uid}`);
  }
};

export const getProfile = async (uid: string): Promise<any> => {
  const profileRef = doc(getDb(), "profiles", uid);
  const socialsRef = doc(getDb(), "profiles", uid, "socials", "links");
  try {
    console.log(`[getProfile] Fetching profile document for profiles/${uid}...`);
    let snap = await getDoc(profileRef);

    if (!snap.exists()) {
      console.log(`[getProfile] profile document profiles/${uid} does not exist. Creating empty profile...`);
      await createEmptyProfile(uid);
      snap = await getDoc(profileRef);
    }

    if (!snap.exists()) {
      return null;
    }

    const profileData = snap.data();
    
    // Fetch socials from subcollection document
    console.log(`[getProfile] Fetching socials from profiles/${uid}/socials/links...`);
    const socialsSnap = await getDoc(socialsRef);
    let socialsData = {};
    if (socialsSnap.exists()) {
      socialsData = socialsSnap.data();
      console.log(`[getProfile] Found socials data from subcollection:`, socialsData);
    } else {
      console.log(`[getProfile] No social links found under subcollection document, checking inline socials or using empty object.`);
      socialsData = profileData.socials || {};
    }

    // Merge socials into profileData
    const result = {
      ...profileData,
      socials: {
        youtube: "",
        instagram: "",
        tiktok: "",
        facebook: "",
        twitter: "",
        discord: "",
        telegram: "",
        linkedin: "",
        twitch: "",
        pinterest: "",
        website: "",
        ...socialsData
      }
    };

    console.log(`[getProfile] Successfully fetched full profile for profiles/${uid}`);
    return result;
  } catch (error) {
    console.error(`[getProfile] Error fetching profile for profiles/${uid}:`, error);
    handleFirestoreError(error, OperationType.GET, `profiles/${uid}`);
    return null;
  }
};

export const updateSocials = async (
  uid: string,
  socials: any
): Promise<void> => {
  const profileRef = doc(getDb(), "profiles", uid);
  const socialsRef = doc(getDb(), "profiles", uid, "socials", "links");
  const userRef = doc(getDb(), "users", uid);
  try {
    console.log(`[updateSocials] Before saving socials for profiles/${uid}/socials/links:`, socials);
    
    // Automatically create parent profile document if it does not exist.
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      console.log(`[updateSocials] Parent profile document profiles/${uid} does not exist. Creating it now...`);
      await createEmptyProfile(uid);
    }

    // Save all social links to the socials subcollection document using setDoc with merge
    await setDoc(socialsRef, socials, { merge: true });

    // Multi-collection sync: Mirror socials field directly to profiles/{uid} and users/{uid}
    await setDoc(profileRef, { socials }, { merge: true });
    await setDoc(userRef, { socials }, { merge: true });

    console.log(`[updateSocials] After successful saved socials and mirrored to parent documents`);
  } catch (error) {
    console.error(`[updateSocials] Error on save for profiles/${uid}/socials/links:`, error);
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${uid}/socials/links`);
    throw error;
  }
};

export const updateBasicProfile = async (
  uid: string,
  data: any
): Promise<void> => {
  const profileRef = doc(getDb(), "profiles", uid);
  const userRef = doc(getDb(), "users", uid);
  try {
    console.log(`[updateBasicProfile] Before saving basic profile for profiles/${uid}:`, data);
    
    // Automatically create if does not exist
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      console.log(`[updateBasicProfile] Profile document profiles/${uid} does not exist. Creating it now...`);
      await createEmptyProfile(uid);
    }

    // Ensure both styles of URLs are populated on profiles for future compatibility
    const finalProfileUpdates: any = { ...data, uid };
    if (data.avatarUrl !== undefined) {
      finalProfileUpdates.photoURL = data.avatarUrl;
    }
    if (data.coverUrl !== undefined) {
      finalProfileUpdates.coverURL = data.coverUrl;
    }
    await setDoc(profileRef, finalProfileUpdates, { merge: true });

    // Multi-collection sync: ensure changes propagate to /users/{uid} for the FirebaseContext to update instantly
    const userUpdates: any = {};
    if (data.displayName !== undefined) {
      userUpdates.displayName = data.displayName;
    }
    if (data.avatarUrl !== undefined) {
      userUpdates.photoURL = data.avatarUrl;
      userUpdates.avatarUrl = data.avatarUrl;
    }
    if (data.coverUrl !== undefined) {
      userUpdates.coverURL = data.coverUrl;
      userUpdates.coverUrl = data.coverUrl;
    }
    if (data.bio !== undefined) {
      userUpdates.intro = {
        bio: data.bio,
        location: "Global Grid",
        company: "Clear Path Markets Science"
      };
    }
    
    if (Object.keys(userUpdates).length > 0) {
      console.log(`[updateBasicProfile] Mirroring profile updates to users/${uid}:`, userUpdates);
      await setDoc(userRef, userUpdates, { merge: true });
    }

    console.log(`[updateBasicProfile] After successful save of basic profile for profiles/${uid} and users/${uid}`);
  } catch (error) {
    console.error(`[updateBasicProfile] Error on save for profiles/${uid}:`, error);
    handleFirestoreError(error, OperationType.UPDATE, `profiles/${uid}`);
    throw error;
  }
};
