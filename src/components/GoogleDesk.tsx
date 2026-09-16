import React, { useState, useEffect } from 'react';
import { 
  Folder, FileSpreadsheet, GraduationCap, Lock, Unlock, 
  ExternalLink, Search, RefreshCw, Layers, Cpu, Database, 
  Trash2, Plus, Bookmark, CheckCircle2, ChevronRight, BookOpen, AlertCircle,
  FileText, Send, CheckSquare, Sparkles, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAuth, db, doc, setDoc, collection, getDocs } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function GoogleDesk() {
  const workspaceStore = typeof window !== 'undefined' ? window.sessionStorage : null;
  const migrateWorkspaceSecret = (key: string): string | null => {
    if (!workspaceStore) return null;
    const fromSession = workspaceStore.getItem(key);
    if (fromSession) return fromSession;
    const fromLocal = localStorage.getItem(key);
    if (fromLocal) {
      workspaceStore.setItem(key, fromLocal);
      localStorage.removeItem(key);
    }
    return fromLocal;
  };

  const [idToken, setIdToken] = useState<string | null>(() => migrateWorkspaceSecret('google_workspace_id_token'));
  const [accessToken, setAccessToken] = useState<string | null>(() => migrateWorkspaceSecret('google_workspace_access_token'));
  const [googleUser, setGoogleUser] = useState<any | null>(() => {
    const saved = migrateWorkspaceSecret('google_workspace_user');
    return saved ? JSON.parse(saved) : null;
  });

  const workspaceAuthHeaders = async (): Promise<Record<string, string>> => {
    let token = idToken;
    try {
      const authInstance = getAuth();
      const current = authInstance?.currentUser;
      if (current) {
        token = await current.getIdToken(/* forceRefresh */ false);
        setIdToken(token);
        workspaceStore?.setItem('google_workspace_id_token', token);
        localStorage.removeItem('google_workspace_id_token');
      }
    } catch {
      /* keep cached token */
    }
    return token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  };

  // Global loading states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active sub-sections
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'docs' | 'classroom' | 'cloudsql' | 'forms'>('sheets');
  const [docsFiles, setDocsFiles] = useState<any[]>([]);
  const [docsSearch, setDocsSearch] = useState('');
  const [docsLoading, setDocsLoading] = useState(false);

  // I. Drive states
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);

  // II. Sheets states
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [sheetMetadata, setSheetMetadata] = useState<any>(null);
  const [selectedSubSheet, setSelectedSubSheet] = useState('');
  const [sheetValues, setSheetValues] = useState<any[][]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsSearchText, setSheetsSearchText] = useState('');

  // III. Classroom states
  const [classroomCourses, setClassroomCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseAnnouncements, setCourseAnnouncements] = useState<any[]>([]);
  const [courseWork, setCourseWork] = useState<any[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
  const [classroomLoading, setClassroomLoading] = useState(false);
  const [courseTab, setCourseTab] = useState<'announcements' | 'assignments' | 'materials'>('announcements');

  // IV. Cloud SQL Assets
  const [cloudSqlAssets, setCloudSqlAssets] = useState<any[]>([]);
  const [cloudSqlLoading, setCloudSqlLoading] = useState(false);
  const [cloudSqlNotes, setCloudSqlNotes] = useState<{ [key: string]: string }>({});

  // V. Forms states
  const [formsList, setFormsList] = useState<any[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [formStats, setFormStats] = useState<any>({});
  const [newFormTitle, setNewFormTitle] = useState('');
  const [formCreatorOpen, setFormCreatorOpen] = useState(false);
  const [formCreating, setFormCreating] = useState(false);
  const [formsSearchText, setFormsSearchText] = useState('');
  const [firebaseSyncingFormId, setFirebaseSyncingFormId] = useState<string | null>(null);
  const [firebaseSyncedForms, setFirebaseSyncedForms] = useState<any[]>([]);

  // Trigger Google OAuth sign-in flow with specific scopes requested by user
  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const authInstance = getAuth();
      if (!authInstance) {
        throw new Error('Firebase Authentication is not initialized.');
      }
      const provider = new GoogleAuthProvider();
      // Docs + Sheets + Drive list (required to browse Workspace files)
      provider.addScope('https://www.googleapis.com/auth/documents');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/drive.readonly');
      provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
      provider.addScope('https://www.googleapis.com/auth/forms.body');
      provider.addScope('https://www.googleapis.com/auth/forms.responses.readonly');
      provider.setCustomParameters({ prompt: 'consent' });

      const result = await signInWithPopup(authInstance, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        const token = credential.accessToken;
        const firebaseIdToken = await result.user.getIdToken();
        setAccessToken(token);
        setIdToken(firebaseIdToken);
        setGoogleUser(result.user);
        workspaceStore?.setItem('google_workspace_access_token', token);
        workspaceStore?.setItem('google_workspace_id_token', firebaseIdToken);
        workspaceStore?.setItem('google_workspace_user', JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        }));
        localStorage.removeItem('google_workspace_access_token');
        localStorage.removeItem('google_workspace_id_token');
        localStorage.removeItem('google_workspace_user');
      } else {
        throw new Error('No OAuth access token was returned by the Google login popup.');
      }
    } catch (err: any) {
      console.error('Google OAuth connection error:', err);
      setErrorMsg(err.message || 'Verification OAuth Handshake Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAccessToken(null);
    setIdToken(null);
    setGoogleUser(null);
    workspaceStore?.removeItem('google_workspace_access_token');
    workspaceStore?.removeItem('google_workspace_id_token');
    workspaceStore?.removeItem('google_workspace_user');
    localStorage.removeItem('google_workspace_access_token');
    localStorage.removeItem('google_workspace_id_token');
    localStorage.removeItem('google_workspace_user');
  };

  // FETCH I. Google Drive Files
  const fetchDriveFiles = async () => {
    if (!accessToken) return;
    setDriveLoading(true);
    setErrorMsg('');
    try {
      let url = 'https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&orderBy=modifiedTime%20desc';
      if (driveSearch.trim()) {
        url = `https://www.googleapis.com/drive/v3/files?q=name+contains+'${encodeURIComponent(driveSearch)}'&pageSize=30&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&orderBy=modifiedTime%20desc`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          handleDisconnect();
          throw new Error('Session expired. Please reconnect Google Workspace.');
        }
        throw new Error(`Drive fetch error, status: ${res.status}`);
      }
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error('Drive fetch error:', err);
      setErrorMsg(err.message || 'Failed to fetch files from Google Drive.');
    } finally {
      setDriveLoading(false);
    }
  };

  /** List Google Docs only (Docs MIME) from Drive. */
  const fetchGoogleDocs = async () => {
    if (!accessToken) return;
    setDocsLoading(true);
    setErrorMsg('');
    try {
      const mime = "mimeType='application/vnd.google-apps.document'";
      const nameQ = docsSearch.trim()
        ? ` and name contains '${docsSearch.trim().replace(/'/g, "\\'")}'`
        : '';
      const q = encodeURIComponent(`${mime}${nameQ}`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=40&fields=files(id,name,mimeType,webViewLink,iconLink,modifiedTime)&orderBy=modifiedTime%20desc`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          handleDisconnect();
          throw new Error('Session expired. Please reconnect Google Workspace.');
        }
        throw new Error(`Docs list failed (${res.status}). Reconnect and allow Docs + Drive access.`);
      }
      const data = await res.json();
      setDocsFiles(data.files || []);
    } catch (err: any) {
      console.error('Docs fetch error:', err);
      setErrorMsg(err.message || 'Failed to list Google Docs.');
    } finally {
      setDocsLoading(false);
    }
  };

  // FETCH II. Google Sheets Content
  const fetchSpreadsheetContent = async (spreadsheetId: string) => {
    if (!accessToken || !spreadsheetId) return;
    setSheetsLoading(true);
    setErrorMsg('');
    try {
      // First fetch metadata to get all sheets inside the spreadsheet
      const metadataRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!metadataRes.ok) {
        throw new Error(`Failed to load sheet metadata. Status: ${metadataRes.status}`);
      }
      const metadata = await metadataRes.json();
      setSheetMetadata(metadata);

      const firstSheetTitle = metadata.sheets?.[0]?.properties?.title || 'Sheet1';
      setSelectedSubSheet(firstSheetTitle);
      await fetchSheetValues(spreadsheetId, firstSheetTitle);
    } catch (err: any) {
      console.error('Sheets metadata fetch error:', err);
      setErrorMsg(err.message || 'Spreadsheet not found or missing credentials.');
    } finally {
      setSheetsLoading(false);
    }
  };

  const fetchSheetValues = async (spreadsheetId: string, sheetTitle: string) => {
    if (!accessToken || !spreadsheetId || !sheetTitle) return;
    setSheetsLoading(true);
    try {
      const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!valuesRes.ok) {
        throw new Error(`Failed to load sheet cells. Status: ${valuesRes.status}`);
      }
      const valData = await valuesRes.json();
      setSheetValues(valData.values || []);
    } catch (err: any) {
      console.error('Sheets cells fetch error:', err);
      setErrorMsg(err.message || 'Failed to load sheet content cells.');
    } finally {
      setSheetsLoading(false);
    }
  };

  // FETCH III. Google Classroom
  const fetchClassroomCourses = async () => {
    if (!accessToken) return;
    setClassroomLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Classroom fetch error: status ${res.status}`);
      }
      const data = await res.json();
      setClassroomCourses(data.courses || []);
    } catch (err: any) {
      console.error('Classroom courses fetch error:', err);
      setErrorMsg(err.message || 'Failed to retrieve enrolled Google Classroom courses.');
    } finally {
      setClassroomLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    if (!accessToken || !courseId) return;
    setClassroomLoading(true);
    try {
      // 1. Fetch Assignments (Coursework)
      const cwRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (cwRes.ok) {
        const cwData = await cwRes.json();
        setCourseWork(cwData.courseWork || []);
      }

      // 2. Fetch Announcements
      const annRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (annRes.ok) {
        const annData = await annRes.json();
        setCourseAnnouncements(annData.announcements || []);
      }

      // 3. Fetch Course Tools / Materials
      const matRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWorkMaterials`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (matRes.ok) {
        const matData = await matRes.json();
        setCourseMaterials(matData.courseWorkMaterials || []);
      }
    } catch (err: any) {
      console.error('Classroom details fetch error:', err);
    } finally {
      setClassroomLoading(false);
    }
  };

  // DATABASE INTERACTION (Cloud SQL CRUD)
  const fetchCloudSqlAssets = async () => {
    if (!googleUser || !googleUser.uid) return;
    setCloudSqlLoading(true);
    try {
      const headers = await workspaceAuthHeaders();
      const res = await fetch(`/api/workspace/assets`, {
        credentials: 'include',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setCloudSqlAssets(data.assets || []);

        // Also fetch notes for saved assets
        const notesRes = await fetch(`/api/workspace/notes`, {
          credentials: 'include',
          headers,
        });
        if (notesRes.ok) {
          const notesData = await notesRes.json();
          const notesMap: { [key: string]: string } = {};
          notesData.notes?.forEach((n: any) => {
            notesMap[n.associatedId] = n.content;
          });
          setCloudSqlNotes(notesMap);
        }
      } else if (res.status === 401) {
        setErrorMsg('Workspace SQL requires a verified Google sign-in (Firebase ID token). Reconnect Google Desk.');
      }
    } catch (err) {
      console.error('Failed to load SQL assets:', err);
    } finally {
      setCloudSqlLoading(false);
    }
  };

  const handleSaveToCloudSql = async (assetId: string, title: string, type: string) => {
    if (!googleUser) return;
    setCloudSqlLoading(true);
    try {
      const headers = await workspaceAuthHeaders();
      const res = await fetch('/api/workspace/assets', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          email: googleUser.email,
          assetId,
          title,
          type
        })
      });
      if (res.ok) {
        await fetchCloudSqlAssets();
      } else {
        const badRes = await res.json();
        setErrorMsg(badRes.error || 'Failed to save asset to Postgres.');
      }
    } catch (err: any) {
      console.error('Save asset to SQL error:', err);
    } finally {
      setCloudSqlLoading(false);
    }
  };

  const handleSaveNote = async (associatedId: string, content: string) => {
    if (!googleUser) return;
    try {
      const headers = await workspaceAuthHeaders();
      const res = await fetch('/api/workspace/notes', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          associatedId,
          content
        })
      });
      if (res.ok) {
        setCloudSqlNotes(prev => ({ ...prev, [associatedId]: content }));
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  const handleDeleteCloudSqlAsset = async (sqlAssetId: number) => {
    try {
      const headers = await workspaceAuthHeaders();
      const res = await fetch(`/api/workspace/assets/${sqlAssetId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      if (res.ok) {
        await fetchCloudSqlAssets();
      }
    } catch (err) {
      console.error('Failed to delete asset from SQL:', err);
    }
  };

  // FETCH V. Google Forms API & Drive Methods
  const fetchGoogleForms = async () => {
    if (!accessToken) return;
    setFormsLoading(true);
    setErrorMsg('');
    try {
      let query = "mimeType='application/vnd.google-apps.form'";
      if (formsSearchText.trim()) {
        query += ` and name contains '${formsSearchText.replace(/'/g, "\\'")}'`;
      }
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=40&fields=files(id,name,webViewLink,iconLink,modifiedTime)`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to load forms from Drive (status ${res.status}).`);
      }
      const data = await res.json();
      setFormsList(data.files || []);
    } catch (err: any) {
      console.error("Forms fetch error:", err);
      setErrorMsg(err.message || "Failed to load Google Forms from your Workspace.");
    } finally {
      setFormsLoading(false);
    }
  };

  const fetchFormDetails = async (formId: string) => {
    if (!accessToken || !formId) return;
    setFormsLoading(true);
    setErrorMsg('');
    try {
      const metaRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!metaRes.ok) {
        throw new Error(`Failed to retrieve form metadata (status ${metaRes.status}).`);
      }
      const formMeta = await metaRes.json();
      setSelectedForm(formMeta);

      const respRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      let responseList: any[] = [];
      if (respRes.ok) {
        const respJson = await respRes.json();
        responseList = respJson.responses || [];
      } else {
        console.warn("No active responses found or API endpoint bypassed. Status:", respRes.status);
      }
      setFormResponses(responseList);
      computeFormStats(formMeta, responseList);
    } catch (err: any) {
      console.error("Form detail load error:", err);
      setErrorMsg(err.message || "Could not fetch active Form metadata description.");
    } finally {
      setFormsLoading(false);
    }
  };

  const computeFormStats = (form: any, responses: any[]) => {
    if (!form || !form.items) return;
    const stats: any = {};
    form.items.forEach((item: any) => {
      const qItem = item.questionItem;
      if (qItem && qItem.question) {
        const qId = qItem.question.questionId;
        const choiceQ = qItem.question.choiceQuestion;
        if (choiceQ && choiceQ.options) {
          const optCounts: { [key: string]: number } = {};
          choiceQ.options.forEach((opt: any) => {
            optCounts[opt.value] = 0;
          });
          responses.forEach((resp) => {
            const ansObj = resp.answers?.[qId];
            if (ansObj && ansObj.textAnswers && ansObj.textAnswers.answers) {
              ansObj.textAnswers.answers.forEach((ans: any) => {
                if (optCounts[ans.value] !== undefined) {
                  optCounts[ans.value]++;
                } else if (ans.value) {
                  optCounts[ans.value] = 1;
                }
              });
            }
          });
          stats[qId] = Object.entries(optCounts).map(([name, count]) => ({ name, count }));
        }
      }
    });
    setFormStats(stats);
  };

  const createNewGoogleForm = async (title: string) => {
    if (!accessToken || !title) return;
    setFormCreating(true);
    setErrorMsg('');
    try {
      const res = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          info: { title }
        })
      });
      if (!res.ok) {
        throw new Error(`Failed to create Google Form in Workspace. Status: ${res.status}`);
      }
      const newForm = await res.json();
      setNewFormTitle('');
      setFormCreatorOpen(false);
      await fetchGoogleForms();
      setSelectedFormId(newForm.formId);
    } catch (err: any) {
      console.error("Create form failed:", err);
      setErrorMsg(err.message || "Failed to create a template Google Form.");
    } finally {
      setFormCreating(false);
    }
  };

  const handleSyncToFirebase = async (formId: string) => {
    if (!formId || !selectedForm) return;
    setFirebaseSyncingFormId(formId);
    setErrorMsg('');
    try {
      const authUser = getAuth().currentUser;
      if (!authUser) {
        throw new Error("User session not found in Firebase Auth.");
      }
      const userId = authUser.uid;

      const formDocRef = doc(db, 'users', userId, 'synced_forms', formId);
      await setDoc(formDocRef, {
        id: formId,
        title: selectedForm?.info?.title || 'Untitled Form',
        description: selectedForm?.info?.description || '',
        userId,
        syncedAt: new Date().toISOString()
      });

      for (const resp of formResponses) {
        const respDocRef = doc(db, 'users', userId, 'synced_forms', formId, 'responses', resp.responseId);
        await setDoc(respDocRef, {
          id: resp.responseId,
          formId,
          userId,
          submittedAt: resp.createTime || resp.lastSubmittedTime || new Date().toISOString(),
          answers: resp.answers || {},
          syncedAt: new Date().toISOString()
        });
      }

      await fetchFirebaseSyncedForms();
    } catch (err: any) {
      console.error("Firestore sync error:", err);
      setErrorMsg(err.message || "Failed to sync Google Form to Firestore.");
    } finally {
      setFirebaseSyncingFormId(null);
    }
  };

  const fetchFirebaseSyncedForms = async () => {
    const authUser = getAuth().currentUser;
    if (!authUser) return;
    try {
      const q = collection(db, 'users', authUser.uid, 'synced_forms');
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach?.((docRef: any) => {
        list.push({ id: docRef.id, ...docRef.data() });
      });
      setFirebaseSyncedForms(list);
    } catch (err) {
      console.error("Failed to load synced forms from Firestore:", err);
    }
  };

  // Sync section triggers when active subtab shifts
  useEffect(() => {
    if (accessToken) {
      if (activeSubTab === 'classroom') {
        fetchClassroomCourses();
      } else if (activeSubTab === 'forms') {
        fetchGoogleForms();
        fetchFirebaseSyncedForms();
      }
      fetchCloudSqlAssets();
    }
  }, [activeSubTab, accessToken]);

  // Sync course elements on selection change
  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseDetails(selectedCourseId);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedFormId) {
      fetchFormDetails(selectedFormId);
    }
  }, [selectedFormId]);

  return (
    <div className="scrollbar-panel relative min-h-screen bg-[#050505] p-6 text-white rounded-[2.5rem] border border-white/5 shadow-2xl overflow-y-auto">
      
      {/* Absolute floating cyber decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00FFFF]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF1493]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800/80 pb-6 mb-8 gap-4 z-10 relative">
        <div>
          <span className="font-mono text-[10px] text-[#FF1493] tracking-[0.25em] font-black block uppercase mb-1">
            Institutional Cloud Portal
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white uppercase font-sans">
            CLEARPATH <span className="text-[#00FFFF]">WORKSPACE</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg font-mono">
            Synchronize your Google Drive, Sheets, and Classroom resources seamlessly with a secure, PostgreSQL-powered SQL database repository.
          </p>
        </div>

        {/* OAuth Authentication Button */}
        <div>
          {accessToken ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-black text-[#00FFFF] font-mono flex items-center gap-1">
                  🟢 SYNCED WITH WORKSPACE
                </span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[200px] font-mono">
                  {googleUser?.email}
                </span>
              </div>
              <button 
                onClick={handleDisconnect}
                className="px-4 py-2 border border-[#FF1493]/40 rounded-xl text-xs font-bold uppercase text-[#FF1493] bg-[#FF1493]/5 hover:bg-[#FF1493]/15 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Unlock size={12} /> Disconnect Workspace
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnect}
              className="px-6 py-3 bg-gradient-to-r from-[#FF1493] via-[#B026FF] to-[#00FFFF] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(255,20,147,0.3)] hover:shadow-[0_0_35px_rgba(255,20,147,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
            >
              <Lock size={14} className="animate-pulse" /> Connect Google Workspace
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs mb-6 font-mono flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main container logic */}
      {!accessToken ? (
        <div className="flex flex-col items-center justify-center py-20 text-center select-none border border-zinc-800/40 rounded-3xl bg-zinc-950/40 backdrop-blur-md max-w-xl mx-auto my-12 p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF1493] to-[#B026FF] flex items-center justify-center text-white mb-6 animate-pulse shadow-lg">
            <Layers size={28} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            Connect Google Docs & Sheets
          </h2>
          <p className="text-xs text-zinc-400 mt-2 max-w-sm font-mono leading-relaxed">
            Sign in with Google to open Docs, browse Sheets, Drive files, Forms, and Classroom.
            Use the same Google account you want linked to this workspace.
          </p>
          <button 
            onClick={handleConnect}
            className="mt-6 px-6 py-3.5 bg-[#FF1493] hover:bg-[#FF1493]/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Connect Google Docs & Sheets
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-stretch">
          
          {/* Sub-tabs Sidebar controller */}
          <div className="xl:col-span-1 flex flex-col gap-3">
            <button
              onClick={() => setActiveSubTab('sheets')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${activeSubTab === 'sheets' ? 'border-[#FF1493] bg-[#FF1493]/5 text-[#FF1493] shadow-[0_0_15px_rgba(255,20,147,0.1)]' : 'border-zinc-800/40 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/60'}`}
            >
              <FileSpreadsheet className="w-5 h-5 shrink-0" />
              <div className="text-left font-sans">
                <div className="text-xs font-black uppercase tracking-wider">I. Google Sheets</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Automated Spreadsheet Analyst</div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveSubTab('docs');
                void fetchGoogleDocs();
              }}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${activeSubTab === 'docs' ? 'border-sky-400 bg-sky-500/5 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'border-zinc-800/40 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/60'}`}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <div className="text-left font-sans">
                <div className="text-xs font-black uppercase tracking-wider">II. Google Docs</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Documents from your Drive</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSubTab('classroom')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${activeSubTab === 'classroom' ? 'border-[#B026FF] bg-[#B026FF]/5 text-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.1)]' : 'border-zinc-800/40 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/60'}`}
            >
              <GraduationCap className="w-5 h-5 shrink-0" />
              <div className="text-left font-sans">
                <div className="text-xs font-black uppercase tracking-wider">III. Google Classroom</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Academic Curricula & Courses</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSubTab('cloudsql')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${activeSubTab === 'cloudsql' ? 'border-[#FF7B00] bg-[#FF7B00]/5 text-[#FF7B00] shadow-[0_0_15px_rgba(255,123,0,0.1)]' : 'border-zinc-800/40 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/60'}`}
            >
              <Database className="w-5 h-5 shrink-0" />
              <div className="text-left font-sans">
                <div className="text-xs font-black uppercase tracking-wider">IV. Cloud SQL Repository</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Secured Postgres Server Safe</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSubTab('forms')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${activeSubTab === 'forms' ? 'border-[#EAB308] bg-yellow-500/5 text-[#EAB308] shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-zinc-800/40 hover:border-zinc-700 bg-zinc-950/20 hover:bg-zinc-950/60'}`}
            >
              <FileText className="w-5 h-5 shrink-0" />
              <div className="text-left font-sans">
                <div className="text-xs font-black uppercase tracking-wider">V. Google Forms</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Forms & Firebase Synced Safe</div>
              </div>
            </button>

            {/* Quick database insight display */}
            <div className="mt-6 p-4 rounded-2xl border border-zinc-800/40 bg-zinc-950/40 font-mono text-[10px] text-zinc-400 space-y-1">
              <span className="text-[#FF7B00] font-black uppercase block mb-1">✦ Cloud SQL Status:</span>
              <div>Server: <strong className="text-white">Active Postgres</strong></div>
              <div>Database: <strong className="text-white">ai-studio-f544fbce</strong></div>
              <div>Synced items: <strong className="text-white">{cloudSqlAssets.length} saved</strong></div>
              <span className="text-[#EAB308] font-black uppercase block pt-2 mb-1">✦ Firestore Vault:</span>
              <div>Synced Forms: <strong className="text-white">{firebaseSyncedForms.length} active</strong></div>
            </div>
          </div>

          {/* Core Window Screen display panel */}
          <div className="xl:col-span-3 border border-zinc-805 bg-zinc-950/60 rounded-3xl p-6 flex flex-col justify-between">
            
            {/* SHEETS SUB TAB SCREEN */}
            {activeSubTab === 'sheets' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <FileSpreadsheet className="text-[#FF1493]" /> Spreadsheet Cell Inspector
                  </h2>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input 
                      type="text"
                      placeholder="Paste Spreadsheet ID..."
                      value={selectedSpreadsheetId}
                      onChange={(e) => setSelectedSpreadsheetId(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF1493] flex-grow md:w-64"
                    />
                    <button 
                      onClick={() => fetchSpreadsheetContent(selectedSpreadsheetId)}
                      className="px-4 py-2 bg-[#FF1493] hover:bg-[#FF1493]/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      Load Sheet
                    </button>
                  </div>
                </div>

                {!sheetMetadata ? (
                  <div className="py-20 text-center border border-dashed border-zinc-850 rounded-2xl text-zinc-500 font-mono text-xs p-6 space-y-4">
                    <p>Paste a spreadsheet ID or import any sheet file to load raw data columns into the cyber viewer.</p>
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 max-w-lg mx-auto text-left space-y-2">
                      <span className="text-[#FF1493] font-bold block uppercase text-[9px] tracking-wider">✦ Typical Spreadsheet IDs look like:</span>
                      <code className="text-[10px] text-zinc-400 select-all font-mono block break-all">1yZgH-Fmre3Y7V8H99O6f0T6Xq_wSByx_0b7zG48vIuQ</code>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Inner worksheet subheaders / tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-zinc-900">
                      {sheetMetadata.sheets?.map((subSheet: any) => {
                        const title = subSheet.properties.title;
                        const isSubActive = selectedSubSheet === title;
                        return (
                          <button
                            key={title}
                            onClick={() => {
                              setSelectedSubSheet(title);
                              fetchSheetValues(selectedSpreadsheetId, title);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${isSubActive ? 'bg-[#FF1493] text-white border border-[#FF1493]' : 'border border-zinc-800 text-zinc-500 hover:text-white'}`}
                          >
                            📁 {title}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center gap-4 py-1">
                      <span className="text-xs font-black uppercase text-zinc-400 font-mono">
                        Spreadsheet Title: <strong className="text-white">{sheetMetadata.properties?.title}</strong>
                      </span>
                      <button
                        onClick={() => handleSaveToCloudSql(selectedSpreadsheetId, sheetMetadata.properties?.title || 'Spreadsheet', 'SHEET')}
                        className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-[#FF7B00] text-zinc-400 hover:text-[#FF7B00] text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bookmark size={11} /> Pin to SQL Server
                      </button>
                    </div>

                    {/* Styled spreadsheet cell layout */}
                    {sheetsLoading ? (
                      <div className="py-16 flex flex-col items-center justify-center font-mono text-xs text-[#FF1493] uppercase">
                        <RefreshCw className="animate-spin mb-3 w-5 h-5" />
                        Parsing worksheet cells...
                      </div>
                    ) : sheetValues.length === 0 ? (
                      <div className="py-20 text-center text-zinc-500 font-mono text-xs border border-zinc-800 rounded-2xl">
                        This worksheet appears to be empty. No values returned.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-zinc-850 rounded-2xl bg-black">
                        <table className="w-full table-auto border-collapse font-mono text-[11px]">
                          <thead>
                            <tr className="bg-zinc-950/80 border-b border-zinc-800">
                              {sheetValues[0]?.map((col, idx) => (
                                <th key={idx} className="p-3 text-left border-r border-zinc-900 text-zinc-500 selection:bg-[#FF1493]">
                                  {col || `Col ${idx + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sheetValues.slice(1).map((row, rowIdx) => (
                              <tr key={rowIdx} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                                {sheetValues[0]?.map((_, colIdx) => (
                                  <td key={colIdx} className="p-3 border-r border-zinc-900 text-zinc-300 selection:bg-[#FF1493]">
                                    {row[colIdx] || <span className="text-zinc-6 /0">--</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DOCS SUB TAB SCREEN */}
            {activeSubTab === 'docs' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <BookOpen className="text-sky-400" /> Google Docs
                  </h2>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search docs by name..."
                      value={docsSearch}
                      onChange={(e) => setDocsSearch(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400 flex-grow md:w-64"
                    />
                    <button
                      type="button"
                      onClick={() => void fetchGoogleDocs()}
                      disabled={docsLoading}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {docsLoading ? 'Loading…' : 'Refresh Docs'}
                    </button>
                  </div>
                </div>

                {docsLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center font-mono text-xs text-sky-400 uppercase">
                    <RefreshCw className="animate-spin mb-3 w-5 h-5" />
                    Loading Google Docs…
                  </div>
                ) : docsFiles.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 font-mono text-xs p-6 space-y-3">
                    <p>No Docs found yet. Click Refresh Docs after connecting, or create a Doc in Google Drive.</p>
                    <p className="text-zinc-600">
                      If this stays empty, disconnect and reconnect — allow Docs and Drive when Google asks.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {docsFiles.map((file) => (
                      <a
                        key={file.id}
                        href={file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-800 bg-black/40 hover:border-sky-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-white font-semibold truncate">{file.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {file.modifiedTime
                                ? `Updated ${new Date(file.modifiedTime).toLocaleString()}`
                                : file.id}
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-zinc-500 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CLASSROOM SUB TAB SCREEN */}
            {activeSubTab === 'classroom' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <GraduationCap className="text-[#B026FF]" /> Google Classroom Academy
                </h2>

                {classroomLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center font-mono text-xs text-[#B026FF] uppercase">
                    <RefreshCw className="animate-spin mb-3 w-5 h-5" />
                    Connecting to Classroom nodes...
                  </div>
                ) : classroomCourses.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl p-6">
                    No active Classroom courses found. Ensure you are registered or teaching inside Google Classroom.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left: Courses list */}
                    <div className="md:col-span-1 border-r border-zinc-900 pr-4 space-y-3 max-h-[500px] overflow-y-auto">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block mb-2">Available Classrooms</span>
                      {classroomCourses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => setSelectedCourseId(course.id)}
                          className={`w-full p-4 text-left rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 ${selectedCourseId === course.id ? 'border-[#B026FF] bg-[#B026FF]/5 text-[#B026FF] shadow-[0_0_15px_rgba(176,38,255,0.08)]' : 'border-zinc-800/40 hover:border-zinc-700 bg-[#050505]'}`}
                        >
                          <span className="text-xs font-black truncate uppercase text-white">{course.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono truncate">{course.section || 'General Section'}</span>
                        </button>
                      ))}
                    </div>

                    {/* Right: Selected Course materials / homework details inspector */}
                    <div className="md:col-span-2 space-y-4">
                      {selectedCourseId ? (
                        <>
                          <div className="flex border-b border-zinc-900">
                            <button
                              onClick={() => setCourseTab('announcements')}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${courseTab === 'announcements' ? 'border-b-2 border-[#B026FF] text-[#B026FF]' : 'text-zinc-500 hover:text-white'}`}
                            >
                              Announcements
                            </button>
                            <button
                              onClick={() => setCourseTab('assignments')}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${courseTab === 'assignments' ? 'border-b-2 border-[#B026FF] text-[#B026FF]' : 'text-zinc-500 hover:text-white'}`}
                            >
                              Assignments & Work
                            </button>
                            <button
                              onClick={() => setCourseTab('materials')}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${courseTab === 'materials' ? 'border-b-2 border-[#B026FF] text-[#B026FF]' : 'text-zinc-500 hover:text-white'}`}
                            >
                              Course Materials
                            </button>
                          </div>

                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {courseTab === 'announcements' && (
                              courseAnnouncements.length === 0 ? (
                                <p className="text-xs text-zinc-500 font-mono italic">No announcements found for this class.</p>
                              ) : (
                                courseAnnouncements.map((ann) => (
                                  <div key={ann.id} className="p-4 rounded-xl border border-zinc-850 bg-black/40 space-y-2">
                                    <p className="text-xs text-zinc-300 whitespace-pre-wrap">{ann.text}</p>
                                    <span className="text-[9px] text-[#B026FF] font-mono block">
                                      Posted: {new Date(ann.creationTime).toLocaleString()}
                                    </span>
                                  </div>
                                ))
                              )
                            )}

                            {courseTab === 'assignments' && (
                              courseWork.length === 0 ? (
                                <p className="text-xs text-zinc-500 font-mono italic">No course assignments uploaded.</p>
                              ) : (
                                courseWork.map((work) => (
                                  <div key={work.id} className="p-4 rounded-xl border border-zinc-850 bg-black/40 flex justify-between items-start gap-4">
                                    <div>
                                      <h4 className="text-xs font-black uppercase text-white">{work.title}</h4>
                                      <p className="text-[10px] text-zinc-500 font-mono mt-1 whitespace-pre-line truncate max-w-lg">
                                        {work.description}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-[9px] text-[#00FFFF] font-mono block uppercase">
                                        Points: {work.maxPoints || 'Ungraded'}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )
                            )}

                            {courseTab === 'materials' && (
                              courseMaterials.length === 0 ? (
                                <p className="text-xs text-zinc-500 font-mono italic">No resource materials available.</p>
                              ) : (
                                courseMaterials.map((mat) => (
                                  <div key={mat.id} className="p-4 rounded-xl border border-zinc-850 bg-black">
                                    <h4 className="text-xs font-black uppercase text-white">{mat.title}</h4>
                                    {mat.description && (
                                      <p className="text-[10px] text-zinc-500 font-mono mt-1">{mat.description}</p>
                                    )}
                                  </div>
                                ))
                              )
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-20 text-center text-zinc-600 font-mono text-xs italic">
                          ← Select an active classroom to inspect curriculum assets and announcements.
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* CLOUD SQL VIEW SCREEN */}
            {activeSubTab === 'cloudsql' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Database className="text-[#FF7B00]" /> Postgres SQL Repository Status
                </h2>

                <p className="text-xs font-mono text-zinc-400">
                  Securely stored tables and bookmarks inside Cloud SQL. You can associate comments or analytical notes to any asset. This is persisted physically on the Google Cloud SQL server.
                </p>

                {cloudSqlLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center font-mono text-xs text-[#FF7B00] uppercase">
                    <RefreshCw className="animate-spin mb-3 w-5 h-5" />
                    Querying Cloud SQL Postgres tables...
                  </div>
                ) : cloudSqlAssets.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 font-mono text-xs border border-zinc-850 rounded-2xl">
                    No bookmarked credentials recorded. In SQL tab, click 'Sync SQL' on any file or sheet to save metadata profiles permanently in Cloud SQL.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cloudSqlAssets.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="p-5 rounded-2xl border border-zinc-800 bg-[#050505] space-y-4"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase font-mono tracking-wider ${asset.type === 'SHEET' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/20'}`}>
                              {asset.type}
                            </span>
                            <div>
                              <h3 className="text-xs font-black uppercase text-white">{asset.title}</h3>
                              <span className="text-[9px] text-zinc-500 font-mono">ID: {asset.assetId}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCloudSqlAsset(asset.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all cursor-pointer"
                            title="Delete record from Cloud SQL database"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Interactive analytical notes synced directly to DB */}
                        <div className="pt-3 border-t border-zinc-900 space-y-2">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">✍ Private Analytical Notes (Auto-saved inside Postgres SQL):</label>
                          <textarea
                            rows={2}
                            placeholder="Type a research note about this spreadsheet or resource..."
                            defaultValue={cloudSqlNotes[asset.assetId] || ''}
                            onBlur={(e) => handleSaveNote(asset.assetId, e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#FF7B00] font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GOOGLE FORMS VIEW SCREEN */}
            {activeSubTab === 'forms' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                      <FileText className="text-yellow-400" /> Google Forms Sync Console
                    </h2>
                    <p className="text-xs font-mono text-zinc-400 mt-1">
                      Enables dynamic integration, telemetry visualization, and cloud archiving inside Google Firestore.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormCreatorOpen(true)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Create New Form
                    </button>
                    <button
                      onClick={fetchGoogleForms}
                      className="p-2 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 transition-all cursor-pointer"
                      title="Refresh forms from drive"
                    >
                      <RefreshCw size={14} className={formsLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {/* Form Creation Modal Overlay */}
                <AnimatePresence>
                  {formCreatorOpen && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                      <motion.div 
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-zinc-950 border border-zinc-850 p-6 rounded-3xl max-w-md w-full space-y-4"
                      >
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Create New Google Form</h3>
                        <p className="text-[11px] text-zinc-500 font-mono">
                          This will initiate a real Google Form template creation inside your Google Workspace account using Forms API.
                        </p>
                        <input
                          type="text"
                          placeholder="Form Name (e.g., Board Customer Feedback)"
                          value={newFormTitle}
                          onChange={(e) => setNewFormTitle(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 font-sans"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setFormCreatorOpen(false)}
                            className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-mono"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={formCreating || !newFormTitle.trim()}
                            onClick={() => createNewGoogleForm(newFormTitle)}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-black uppercase tracking-wider text-xs rounded-xl"
                          >
                            {formCreating ? "Creating..." : "Create Form"}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  
                  {/* LEFT: Drive Lists & Firebase Config Catalog */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Google Form files from Drive list */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        📂 Drive Directory
                      </h3>
                      <input
                        type="text"
                        placeholder="Filter forms..."
                        value={formsSearchText}
                        onChange={(e) => setFormsSearchText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchGoogleForms()}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-yellow-500"
                      />
                      {formsLoading && formsList.length === 0 ? (
                        <div className="py-8 text-center font-mono text-[10px] text-zinc-500">
                          <RefreshCw className="animate-spin inline mr-1 w-3.5 h-3.5" /> Loading...
                        </div>
                      ) : formsList.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 font-mono italic">No Workspace forms found.</p>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                          {formsList.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setSelectedFormId(f.id)}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs font-sans transition-all flex items-start gap-2 cursor-pointer ${selectedFormId === f.id ? "border-yellow-500 bg-yellow-500/5 text-yellow-400" : "border-zinc-900/60 hover:border-zinc-800 bg-zinc-950/40"}`}
                            >
                              <FileText className="w-4 h-4 shrink-0 text-yellow-500 mt-0.5" />
                              <div className="truncate">
                                <p className="font-semibold truncate text-[11px]">{f.name}</p>
                                <p className="text-[9px] text-zinc-500 font-mono mt-0.5">ID: {f.id.substring(0, 10)}...</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Firestore archives list */}
                    <div className="p-4 rounded-2xl border border-zinc-850 bg-zinc-950/40 space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                        <Sparkles size={11} /> Firestore Archives
                      </h3>
                      {firebaseSyncedForms.length === 0 ? (
                        <p className="text-[10px] text-zinc-600 font-mono italic">No forms synchronized with Firestore.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {firebaseSyncedForms.map((sf) => (
                            <div 
                              key={sf.id}
                              onClick={() => setSelectedFormId(sf.id)}
                              className={`p-2 rounded-lg border border-zinc-900 bg-black/60 cursor-pointer hover:border-zinc-800 transition-all text-[10px] flex items-center justify-between ${selectedFormId === sf.id ? "border-yellow-500/40" : ""}`}
                            >
                              <div className="truncate">
                                <span className="font-black text-white truncate block">{sf.title}</span>
                                <span className="text-[8px] text-zinc-500 font-mono">{new Date(sf.syncedAt).toLocaleDateString()}</span>
                              </div>
                              <span className="text-[8px] uppercase tracking-wider text-green-400 font-black shrink-0">Synced</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Selected Form Workspace Interface */}
                  <div className="lg:col-span-3 min-h-[450px]">
                    {selectedForm ? (
                      <div className="space-y-6">
                        
                        {/* Selected Form Header */}
                        <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <span className="text-[9px] font-mono font-black text-yellow-400 uppercase tracking-widest block">Active Google Form File</span>
                            <h3 className="text-lg font-black uppercase text-white mt-0.5">{selectedForm?.info?.title || "Untitled Form"}</h3>
                            {selectedForm?.info?.description && (
                              <p className="text-xs font-mono text-zinc-500 mt-1 whitespace-pre-wrap">{selectedForm.info.description}</p>
                            )}
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              disabled={firebaseSyncingFormId === selectedFormId}
                              onClick={() => handleSyncToFirebase(selectedFormId)}
                              className="px-3.5 py-2 hover:opacity-90 disabled:opacity-50 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-yellow-500 to-green-500 text-black rounded-xl cursor-pointer flex items-center gap-1.5 transition-all w-full md:w-auto text-center"
                            >
                              {firebaseSyncingFormId === selectedFormId ? (
                                <RefreshCw className="animate-spin w-3.5 h-3.5" />
                              ) : (
                                <Sparkles size={13} />
                              )}
                              Sync to FireStore
                            </button>
                            <a 
                              href={selectedForm.responderUri || `https://docs.google.com/forms/d/${selectedFormId}/viewform`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-xl text-xs flex items-center gap-1.5 w-full md:w-auto justify-center"
                            >
                              Open Form <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-xl border border-zinc-850 bg-black/40">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Submissions</span>
                            <strong className="text-xl font-sans font-black text-white">{formResponses.length}</strong>
                          </div>
                          <div className="p-4 rounded-xl border border-zinc-850 bg-black/40">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Questions Count</span>
                            <strong className="text-xl font-sans font-black text-white">{selectedForm?.items?.length || 0}</strong>
                          </div>
                          <div className="p-4 rounded-xl border border-zinc-850 bg-black/40">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Firebase Sync Status</span>
                            <strong className="text-xs font-mono font-black text-green-400 mt-1 block">
                              {firebaseSyncedForms.some(f => f.id === selectedFormId) ? "SECURED IN CLOUD" : "LOCAL ONLY"}
                            </strong>
                          </div>
                          <div className="p-4 rounded-xl border border-zinc-850 bg-black/40">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Form ID Handle</span>
                            <span className="text-[10px] font-mono text-zinc-400 block truncate mt-1">{selectedFormId}</span>
                          </div>
                        </div>

                        {/* Interactive analytical insights section */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-[#00FFFF] flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                            <BarChart2 size={13} /> Analytical Metric Telemetry
                          </h4>

                          {selectedForm.items && selectedForm.items.length > 0 ? (
                            <div className="space-y-6">
                              {selectedForm.items.map((item: any) => {
                                const qDetails = item.questionItem?.question;
                                const isMultipleChoice = !!qDetails?.choiceQuestion;
                                const questionId = qDetails?.questionId;
                                const qStats = formStats[questionId] || [];

                                return (
                                  <div key={item.itemId} className="p-5 rounded-2xl border border-zinc-850 bg-zinc-950/80 space-y-3">
                                    <div className="flex justify-between items-start gap-4">
                                      <div>
                                        <h5 className="text-[11px] font-black uppercase text-white">{item.title}</h5>
                                        {item.description && (
                                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.description}</p>
                                        )}
                                      </div>
                                      <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[8px] font-mono text-zinc-400 uppercase rounded">
                                        Type: {qDetails?.choiceQuestion?.type || "TEXT/INPUT"}
                                      </span>
                                    </div>

                                    {/* Multiple choice stats visualized */}
                                    {isMultipleChoice && qStats.length > 0 ? (
                                      <div className="space-y-2.5 pt-1">
                                        {qStats.map((stat: any) => {
                                          const percent = formResponses.length > 0 
                                            ? Math.round((stat.count / formResponses.length) * 100) 
                                            : 0;
                                          return (
                                            <div key={stat.name} className="space-y-1">
                                              <div className="flex justify-between items-center text-[10px] font-mono">
                                                <span className="text-zinc-300 font-semibold">{stat.name}</span>
                                                <span className="text-zinc-400">{stat.count} responses ({percent}%)</span>
                                              </div>
                                              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                                <div 
                                                  className="h-full bg-gradient-to-r from-yellow-500 via-green-500 to-teal-500 rounded-full" 
                                                  style={{ width: `${percent}%` }}
                                                />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      /* Write in comments lists */
                                      <div className="space-y-1 max-h-32 overflow-y-auto border-t border-zinc-900/60 pt-2 text-[10px] font-mono text-zinc-400">
                                        {formResponses.some(r => r.answers?.[questionId]) ? (
                                          <div className="space-y-1.5 pr-1">
                                            {formResponses.map((r, ri) => {
                                              const textAns = r.answers?.[questionId]?.textAnswers?.answers?.[0]?.value;
                                              if (!textAns) return null;
                                              return (
                                                <div key={ri} className="p-2 border border-zinc-900 bg-black/35 rounded-lg">
                                                  "{textAns}"
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <p className="text-[10px] text-zinc-600 font-mono italic">No written responses submitted.</p>
                                        )}
                                      </div>
                                    )}

                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-500 font-mono italic">This form is empty and contains no questions.</p>
                          )}
                        </div>

                      </div>
                    ) : (
                      <div className="h-full border border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center py-20 text-center text-zinc-600 font-mono text-xs">
                        <FileText size={32} className="text-zinc-700 mb-3" />
                        <div>← Select an active Google Form from your catalog to map response indicators.</div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
