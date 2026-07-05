# Fix My PC — one script: update, clean junk, fix crashes. Run as Administrator.
#Requires -Version 5.1
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

$log = "$env:USERPROFILE\Desktop\FIX-MY-PC-log.txt"
function Log($m) { $line = "[$(Get-Date -Format 'HH:mm:ss')] $m"; Write-Host $line; Add-Content $log $line }

Log "=== FIX MY PC STARTED ==="
Log "Computer: $env:COMPUTERNAME"

# 1. WINDOWS UPDATE
Log "Installing Windows updates..."
try {
    $s = New-Object -ComObject Microsoft.Update.Session
    $sr = $s.CreateUpdateSearcher()
    $r = $sr.Search("IsInstalled=0 and IsHidden=0")
    if ($r.Updates.Count -gt 0) {
        $col = New-Object -ComObject Microsoft.Update.UpdateColl
        foreach ($u in $r.Updates) { $col.Add($u) | Out-Null; Log "  Update: $($u.Title)" }
        $dl = $s.CreateUpdateDownloader(); $dl.Updates = $col; [void]$dl.Download()
        $ins = $s.CreateUpdateInstaller(); $ins.Updates = $col; [void]$ins.Install()
        Log "Windows updates installed."
    } else { Log "Windows is up to date." }
} catch { Log "Windows Update error: $_" }
if (Get-Command UsoClient.exe -EA SilentlyContinue) {
    UsoClient.exe StartScan; UsoClient.exe StartDownload; UsoClient.exe StartInstall
    Log "UsoClient update triggered."
}

# 2. UPDATE ALL APPS
Log "Updating all apps (winget)..."
if (Get-Command winget.exe -EA SilentlyContinue) {
    winget source update --disable-interactivity 2>$null
    winget upgrade --all --accept-package-agreements --accept-source-agreements --disable-interactivity --include-unknown 2>$null
    Log "App updates done."
} else { Log "winget not found — open Microsoft Store, update App Installer." }

# 3. SECURITY
Log "Updating virus protection..."
try { Update-MpSignature; Start-MpScan -ScanType FullScan; Log "Defender updated, full scan started." } catch { Log "Defender: $_" }

# 4. CLEAN JUNK OUT OF SYSTEM
Log "Cleaning junk files..."
Get-ChildItem $env:TEMP -Force -EA SilentlyContinue | Remove-Item -Recurse -Force -EA SilentlyContinue
Get-ChildItem C:\Windows\Temp -Force -EA SilentlyContinue | Remove-Item -Recurse -Force -EA SilentlyContinue
Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Windows\INetCache" -Force -EA SilentlyContinue | Remove-Item -Recurse -Force -EA SilentlyContinue
try {
    Stop-Service wuauserv -Force -EA SilentlyContinue
    Get-ChildItem C:\Windows\SoftwareDistribution\Download -Force -EA SilentlyContinue | Remove-Item -Recurse -Force -EA SilentlyContinue
    Start-Service wuauserv -EA SilentlyContinue
} catch {}
Clear-RecycleBin -Force -EA SilentlyContinue
ipconfig /flushdns | Out-Null
Log "Junk cleaned."

# 5. FIX CRASHES — repair Windows files
Log "Repairing Windows (DISM) — wait, this takes a while..."
DISM /Online /Cleanup-Image /RestoreHealth
Log "DISM done."

Log "Repairing Windows (SFC) — wait, this takes a while..."
sfc /scannow
Log "SFC done."

Log "Checking drive for errors..."
chkdsk C: /scan
Log "Drive check done."

# 6. 144Hz if possible
try {
    Add-Type @"
using System; using System.Runtime.InteropServices;
public class D {
    public const int E=-1; public const int U=1; public const int OK=0;
    [StructLayout(LayoutKind.Sequential,CharSet=CharSet.Unicode)] public struct M {
        [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string a;
        public short b,c,d,e; public int f,g,h,i,j; public short k,l,m,n,o;
        [MarshalAs(UnmanagedType.ByValTStr,SizeConst=32)] public string p;
        public short q; public int r,s,t,u,v,w,x,y,z,aa,ab,ac,ad;
    }
    [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern bool EnumDisplaySettings(string d,int n,ref M m);
    [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int ChangeDisplaySettings(ref M m,int f);
}
"@
    $cur = New-Object D+M; $cur.d = [Runtime.InteropServices.Marshal]::SizeOf($cur)
    [void][D]::EnumDisplaySettings($null,[D]::E,[ref]$cur)
    $i=0; $best=$null; $m=New-Object D+M
    while([D]::EnumDisplaySettings($null,$i,[ref]$m)){
        if($m.t -eq $cur.t -and $m.u -eq $cur.u -and $m.v -eq 144){$best=$m;break}; $i++
    }
    if($best){ [void][D]::ChangeDisplaySettings([ref]$best,[D]::U); Log "Display set to 144Hz." }
} catch { Log "144Hz: skipped." }

Log "=== ALL DONE ==="
Log "Log saved to: $log"
Log "RESTART YOUR PC NOW."
$r = Read-Host "Restart now? Type Y and press Enter"
if ($r -eq 'Y') { shutdown /r /t 30 /c "Fix My PC restart" }
