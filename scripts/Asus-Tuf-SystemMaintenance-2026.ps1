#Requires -Version 5.1
<#
.SYNOPSIS
    ASUS TUF Gaming (144Hz Adaptive Sync) — full system maintenance, update, deep clean, and forensic audit.

.DESCRIPTION
    Run elevated on Windows 10/11. Phases:
      1. Pre-flight + 144Hz / Adaptive Sync display check
      2. Windows Update (COM) — security + all categories
      3. Winget + Microsoft Store app upgrades
      4. Security hardening (Defender, firewall, optional features)
      5. Deep clean (temp, DISM, component store, caches)
      6. Forensic audit (integrity, autoruns, network, event logs, report)

.PARAMETER SkipReboot
    Do not prompt for reboot after updates.

.PARAMETER SkipForensic
    Skip forensic phase (faster run).

.PARAMETER Force144Hz
    Attempt to set primary display to 144Hz when supported.

.PARAMETER ReportPath
    Folder for logs and forensic report. Default: Desktop\TUF-Maintenance-Reports

.EXAMPLE
    .\Asus-Tuf-SystemMaintenance-2026.ps1

.EXAMPLE
    .\Asus-Tuf-SystemMaintenance-2026.ps1 -Force144Hz -ReportPath "D:\Forensics"
#>

[CmdletBinding()]
param(
    [switch] $SkipReboot,
    [switch] $SkipForensic,
    [switch] $Force144Hz,
    [string] $ReportPath = "$env:USERPROFILE\Desktop\TUF-Maintenance-Reports"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$Script:RunStamp   = Get-Date -Format 'yyyyMMdd-HHmmss'
$Script:LogFile    = Join-Path $ReportPath "maintenance-$RunStamp.log"
$Script:ReportFile = Join-Path $ReportPath "forensic-report-$RunStamp.html"
$Script:PhaseResults = [System.Collections.Generic.List[object]]::new()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Write-Log {
    param(
        [string] $Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'OK', 'PHASE')]
        [string] $Level = 'INFO'
    )
    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    switch ($Level) {
        'ERROR' { Write-Host $line -ForegroundColor Red }
        'WARN'  { Write-Host $line -ForegroundColor Yellow }
        'OK'    { Write-Host $line -ForegroundColor Green }
        'PHASE' { Write-Host $line -ForegroundColor Cyan }
        default { Write-Host $line }
    }
    if (Test-Path (Split-Path $Script:LogFile -Parent)) {
        Add-Content -Path $Script:LogFile -Value $line -Encoding UTF8
    }
}

function Test-IsAdmin {
    $identity  = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]$identity
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Start-Phase {
    param([string] $Name)
    Write-Log "========== $Name ==========" -Level PHASE
    return [pscustomobject]@{
        Name      = $Name
        Started   = Get-Date
        Status    = 'Running'
        Details   = @()
        Ended     = $null
    }
}

function Complete-Phase {
    param(
        [pscustomobject] $Phase,
        [string] $Status = 'OK',
        [string[]] $Details = @()
    )
    $Phase.Status  = $Status
    $Phase.Details = $Details
    $Phase.Ended   = Get-Date
    $Script:PhaseResults.Add($Phase) | Out-Null
    Write-Log "Phase '$($Phase.Name)' finished: $Status" -Level $(if ($Status -eq 'OK') { 'OK' } else { 'WARN' })
}

function Invoke-External {
    param(
        [string] $FilePath,
        [string[]] $ArgumentList = @(),
        [int] $SuccessExitCodes = 0,
        [string] $Label = $FilePath
    )
    Write-Log "Running: $Label $($ArgumentList -join ' ')"
    $psi = @{
        FilePath               = $FilePath
        ArgumentList           = $ArgumentList
        NoNewWindow            = $true
        Wait                   = $true
        PassThru               = $true
        RedirectStandardOutput = "$env:TEMP\tuf-stdout-$RunStamp.txt"
        RedirectStandardError  = "$env:TEMP\tuf-stderr-$RunStamp.txt"
    }
    $proc = Start-Process @psi
    $stdout = if (Test-Path $psi.RedirectStandardOutput) { Get-Content $psi.RedirectStandardOutput -Raw -ErrorAction SilentlyContinue } else { '' }
    $stderr = if (Test-Path $psi.RedirectStandardError)  { Get-Content $psi.RedirectStandardError  -Raw -ErrorAction SilentlyContinue } else { '' }
    if ($stdout) { Write-Log $stdout.Trim() }
    if ($stderr) { Write-Log $stderr.Trim() -Level WARN }
    return ($proc.ExitCode -eq $SuccessExitCodes)
}

# ---------------------------------------------------------------------------
# Phase 0 — Bootstrap
# ---------------------------------------------------------------------------

function Initialize-Maintenance {
    if (-not (Test-IsAdmin)) {
        Write-Log 'Administrator rights required. Relaunching elevated...' -Level WARN
        $args = @(
            '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`""
        )
        if ($SkipReboot)   { $args += '-SkipReboot' }
        if ($SkipForensic) { $args += '-SkipForensic' }
        if ($Force144Hz)   { $args += '-Force144Hz' }
        if ($ReportPath)   { $args += '-ReportPath', "`"$ReportPath`"" }
        Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $args
        exit
    }

    New-Item -ItemType Directory -Path $ReportPath -Force | Out-Null
    Write-Log "ASUS TUF System Maintenance 2026 — log: $Script:LogFile"
    Write-Log "Computer: $env:COMPUTERNAME | User: $env:USERNAME | OS: $((Get-CimInstance Win32_OperatingSystem).Caption)"
}

# ---------------------------------------------------------------------------
# Phase 1 — Display: 144Hz + Adaptive Sync (WMI / COM / vendor hints)
# ---------------------------------------------------------------------------

function Get-DisplayProfile {
    $profile = [ordered]@{
        GPU              = @()
        Monitors         = @()
        AdaptiveSyncHint = @()
        CurrentHz        = @()
    }

    try {
        $gpus = Get-CimInstance Win32_VideoController | Where-Object { $_.Name -and $_.Status -eq 'OK' }
        foreach ($gpu in $gpus) {
            $profile.GPU += [ordered]@{
                Name    = $gpu.Name
                Driver  = $gpu.DriverVersion
                RAM_MB  = [math]::Round($gpu.AdapterRAM / 1MB, 0)
            }
        }
    } catch {
        Write-Log "GPU enumeration failed: $_" -Level WARN
    }

    # WMI monitor modes (supported refresh rates)
    try {
        $modes = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorListedSupportedSourceModes -ErrorAction Stop
        foreach ($m in $modes) {
            $instance = $m.InstanceName
            $supported = @()
            if ($m.MonitorSourceModes) {
                foreach ($raw in $m.MonitorSourceModes) {
                    $w = [BitConverter]::ToUInt32($raw, 0)
                    $h = [BitConverter]::ToUInt32($raw, 4)
                    $hz = [BitConverter]::ToUInt32($raw, 8) / 1000.0
                    $supported += "${w}x${h} @ ${hz}Hz"
                }
            }
            $profile.Monitors += [ordered]@{
                Instance = $instance
                Modes    = ($supported | Select-Object -Unique)
            }
        }
    } catch {
        Write-Log "WMI monitor mode query unavailable: $_" -Level WARN
    }

    # Current desktop refresh via user32 ChangeDisplaySettings query pattern
    try {
        Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DisplayUtil {
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    public struct DEVMODE {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmDeviceName;
        public short dmSpecVersion; public short dmDriverVersion; public short dmSize; public short dmDriverExtra;
        public int dmFields; public int dmPositionX; public int dmPositionY; public int dmDisplayOrientation;
        public int dmDisplayFixedOutput; public short dmColor; public short dmDuplex; public short dmYResolution;
        public short dmTTOption; public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmFormName;
        public short dmLogPixels; public int dmBitsPerPel; public int dmPelsWidth; public int dmPelsHeight;
        public int dmDisplayFlags; public int dmDisplayFrequency; public int dmICMMethod; public int dmICMIntent;
        public int dmMediaType; public int dmDitherType; public int dmReserved1; public int dmReserved2;
        public int dmPanningWidth; public int dmPanningHeight;
    }
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern bool EnumDisplaySettings(string lpszDeviceName, int iModeNum, ref DEVMODE lpDevMode);
}
"@ -ErrorAction Stop

        $dm = New-Object DisplayUtil+DEVMODE
        $dm.dmSize = [System.Runtime.InteropServices.Marshal]::SizeOf($dm)
        $i = 0
        while ([DisplayUtil]::EnumDisplaySettings($null, $i, [ref]$dm)) {
            if ($dm.dmDisplayFrequency -ge 60) {
                $profile.CurrentHz += "${dm.dmPelsWidth}x$($dm.dmPelsHeight) @ $($dm.dmDisplayFrequency)Hz"
            }
            $i++
        }
        $profile.CurrentHz = $profile.CurrentHz | Select-Object -Unique
    } catch {
        Write-Log "Current refresh rate query failed: $_" -Level WARN
    }

    # Vendor adaptive sync hints (NVIDIA G-Sync / AMD FreeSync / Intel)
    $nvidia = Get-Command 'nvidia-smi.exe' -ErrorAction SilentlyContinue
    if ($nvidia) {
        $smi = & nvidia-smi.exe --query-gpu=name,driver_version --format=csv,noheader 2>$null
        $profile.AdaptiveSyncHint += "NVIDIA GPU detected. Enable G-Sync/Adaptive Sync in NVIDIA Control Panel > Set up G-Sync."
        if ($smi) { $profile.AdaptiveSyncHint += "nvidia-smi: $smi" }
    }

    $amd = Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}\*\*' -ErrorAction SilentlyContinue |
        Where-Object { $_.DriverDesc -match 'AMD|Radeon' } | Select-Object -First 1
    if ($amd) {
        $profile.AdaptiveSyncHint += 'AMD GPU detected. Enable FreeSync/Adaptive Sync in AMD Software: Adrenalin > Display > AMD FreeSync.'
    }

    $profile.AdaptiveSyncHint += 'ASUS TUF panel: Armoury Crate > System Configuration > Display (or MyASUS) — confirm 144Hz + Adaptive-Sync/FreeSync is ON in BIOS (iGPU/dGPU mux may affect external panel).'

    return $profile
}

function Set-PrimaryDisplay144Hz {
    param([int] $TargetHz = 144)

    Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DisplayChange {
    public const int ENUM_CURRENT_SETTINGS = -1;
    public const int CDS_UPDATEREGISTRY = 0x01;
    public const int CDS_TEST = 0x02;
    public const int DISP_CHANGE_SUCCESSFUL = 0;
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    public struct DEVMODE {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmDeviceName;
        public short dmSpecVersion; public short dmDriverVersion; public short dmSize; public short dmDriverExtra;
        public int dmFields; public int dmPositionX; public int dmPositionY; public int dmDisplayOrientation;
        public int dmDisplayFixedOutput; public short dmColor; public short dmDuplex; public short dmYResolution;
        public short dmTTOption; public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmFormName;
        public short dmLogPixels; public int dmBitsPerPel; public int dmPelsWidth; public int dmPelsHeight;
        public int dmDisplayFlags; public int dmDisplayFrequency; public int dmICMMethod; public int dmICMIntent;
        public int dmMediaType; public int dmDitherType; public int dmReserved1; public int dmReserved2;
        public int dmPanningWidth; public int dmPanningHeight;
    }
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern bool EnumDisplaySettings(string device, int modeNum, ref DEVMODE devMode);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int ChangeDisplaySettings(ref DEVMODE devMode, int flags);
}
"@ -ErrorAction Stop

    $current = New-Object DisplayChange+DEVMODE
    $current.dmSize = [System.Runtime.InteropServices.Marshal]::SizeOf($current)
    [void][DisplayChange]::EnumDisplaySettings($null, [DisplayChange]::ENUM_CURRENT_SETTINGS, [ref]$current)

    $best = $null
    $i = 0
    $candidate = New-Object DisplayChange+DEVMODE
    while ([DisplayChange]::EnumDisplaySettings($null, $i, [ref]$candidate)) {
        if ($candidate.dmPelsWidth -eq $current.dmPelsWidth -and
            $candidate.dmPelsHeight -eq $current.dmPelsHeight -and
            $candidate.dmDisplayFrequency -eq $TargetHz) {
            $best = $candidate
            break
        }
        $i++
    }

    if (-not $best) {
        Write-Log "No ${TargetHz}Hz mode found at current resolution ($($current.dmPelsWidth)x$($current.dmPelsHeight))." -Level WARN
        return $false
    }

    $test = $best
    $rc = [DisplayChange]::ChangeDisplaySettings([ref]$test, [DisplayChange]::CDS_TEST)
    if ($rc -ne [DisplayChange]::DISP_CHANGE_SUCCESSFUL) {
        Write-Log "144Hz test mode failed (code $rc)." -Level WARN
        return $false
    }

    $rc = [DisplayChange]::ChangeDisplaySettings([ref]$best, [DisplayChange]::CDS_UPDATEREGISTRY)
    if ($rc -eq [DisplayChange]::DISP_CHANGE_SUCCESSFUL) {
        Write-Log "Primary display set to ${TargetHz}Hz at $($best.dmPelsWidth)x$($best.dmPelsHeight)." -Level OK
        return $true
    }

    Write-Log "ChangeDisplaySettings returned code $rc." -Level WARN
    return $false
}

# ---------------------------------------------------------------------------
# Phase 2 — Windows Update via COM (Microsoft.Update.Session)
# ---------------------------------------------------------------------------

function Install-WindowsUpdatesCom {
    $details = [System.Collections.Generic.List[string]]::new()

    try {
        $session  = New-Object -ComObject Microsoft.Update.Session
        $searcher = $session.CreateUpdateSearcher()
        Write-Log 'Searching Windows Update (COM)...'

        # Security + critical + rollups + drivers + feature packs
        $criteria = "IsInstalled=0 and IsHidden=0 and Type='Software'"
        $result   = $searcher.Search($criteria)
        $updates  = $result.Updates

        if ($updates.Count -eq 0) {
            $details.Add('No pending software updates found via COM.')
            return $details
        }

        $details.Add("Found $($updates.Count) software update(s).")
        $toInstall = New-Object -ComObject 'Microsoft.Update.UpdateColl'

        foreach ($u in $updates) {
            $toInstall.Add($u) | Out-Null
            $details.Add("- $($u.Title)")
        }

        $downloader = $session.CreateUpdateDownloader()
        $downloader.Updates = $toInstall
        Write-Log "Downloading $($toInstall.Count) update(s)..."
        [void]$downloader.Download()

        $installer = $session.CreateUpdateInstaller()
        $installer.Updates = $toInstall
        Write-Log 'Installing updates (may take a long time)...'
        $installResult = $installer.Install()

        for ($i = 0; $i -lt $toInstall.Count; $i++) {
            $code = $installResult.GetUpdateResult($i).ResultCode
            $details.Add("Install result [$i]: $code — $($toInstall.Item($i).Title)")
        }

        # Optional driver updates
        $driverCriteria = "IsInstalled=0 and IsHidden=0 and Type='Driver'"
        $driverResult   = $searcher.Search($driverCriteria)
        if ($driverResult.Updates.Count -gt 0) {
            $drivers = New-Object -ComObject 'Microsoft.Update.UpdateColl'
            foreach ($d in $driverResult.Updates) { $drivers.Add($d) | Out-Null }
            $downloader.Updates = $drivers
            [void]$downloader.Download()
            $installer.Updates = $drivers
            $drvInstall = $installer.Install()
            $details.Add("Driver updates processed: $($drivers.Count) (last result code $($drvInstall.ResultCode)).")
        }
    } catch {
        $details.Add("COM Windows Update error: $_")
        Write-Log $details[-1] -Level ERROR
    }

    # Fallback: USO / WU client
    if (Get-Command 'UsoClient.exe' -ErrorAction SilentlyContinue) {
        Invoke-External -FilePath 'UsoClient.exe' -ArgumentList @('StartScan') -Label 'UsoClient StartScan' | Out-Null
        Invoke-External -FilePath 'UsoClient.exe' -ArgumentList @('StartDownload') -Label 'UsoClient StartDownload' | Out-Null
        Invoke-External -FilePath 'UsoClient.exe' -ArgumentList @('StartInstall') -Label 'UsoClient StartInstall' | Out-Null
        $details.Add('Triggered UsoClient scan/download/install.')
    }

    return $details
}

# ---------------------------------------------------------------------------
# Phase 3 — Application updates (winget, Store, chocolatey if present)
# ---------------------------------------------------------------------------

function Update-InstalledApplications {
    $details = [System.Collections.Generic.List[string]]::new()

    # Ensure winget
    $winget = Get-Command 'winget.exe' -ErrorAction SilentlyContinue
    if (-not $winget) {
        $details.Add('winget not found — install App Installer from Microsoft Store for app upgrades.')
    } else {
        Invoke-External -FilePath 'winget.exe' -ArgumentList @(
            'source', 'update', '--disable-interactivity'
        ) -Label 'winget source update' | Out-Null

        $ok = Invoke-External -FilePath 'winget.exe' -ArgumentList @(
            'upgrade', '--all',
            '--accept-package-agreements',
            '--accept-source-agreements',
            '--disable-interactivity',
            '--include-unknown'
        ) -SuccessExitCodes 0 -Label 'winget upgrade --all'
        $details.Add($(if ($ok) { 'winget upgrade --all completed.' } else { 'winget upgrade finished with warnings (some packages may need manual update).' }))
    }

    # Microsoft Store apps (Win11 / Win10 with App Installer)
    if (Get-Command 'Get-CimInstance' -ErrorAction SilentlyContinue) {
        try {
            $store = New-Object -ComObject Shell.Application
            $details.Add('Store COM shell available — run "winget upgrade --all" covers most Store packages.')
        } catch { }
    }

    # Chocolatey optional
    $choco = Get-Command 'choco.exe' -ErrorAction SilentlyContinue
    if ($choco) {
        $ok = Invoke-External -FilePath 'choco.exe' -ArgumentList @('upgrade', 'all', '-y') -Label 'choco upgrade all'
        $details.Add($(if ($ok) { 'Chocolatey upgrade all completed.' } else { 'Chocolatey upgrade reported issues.' }))
    }

    # ASUS / gaming utilities (winget IDs — install if missing, upgrade if present)
    $asusPackages = @(
        '9NBLGGH4NSM4',   # MyASUS (may vary by region)
        'ArmouryCrate',   # search name fallback below
        'NVIDIA.GeForceExperience',
        'AdvancedMicroDevices.AMDSoftware'
    )
    if ($winget) {
        foreach ($pkg in @('Asus.ArmouryCrate', 'Asus.MyASUS', 'NVIDIA.GeForceExperience', 'AdvancedMicroDevices.AMDSoftware')) {
            $search = & winget.exe search $pkg --disable-interactivity 2>$null
            if ($LASTEXITCODE -eq 0) {
                & winget.exe upgrade --id $pkg -e --accept-package-agreements --accept-source-agreements --disable-interactivity 2>$null
                if ($LASTEXITCODE -ne 0) {
                    & winget.exe install --id $pkg -e --accept-package-agreements --accept-source-agreements --disable-interactivity 2>$null
                }
                $details.Add("Processed winget package: $pkg")
            }
        }
    }

    return $details
}

# ---------------------------------------------------------------------------
# Phase 4 — Security
# ---------------------------------------------------------------------------

function Invoke-SecurityMaintenance {
    $details = [System.Collections.Generic.List[string]]::new()

    # Defender signature update + quick scan baseline
    try {
        Update-MpSignature -ErrorAction Stop
        $details.Add('Windows Defender signatures updated.')
    } catch {
        $details.Add("Defender signature update: $_")
    }

    try {
        $sig = Get-MpComputerStatus
        $details.Add("Defender: AMEngine=$($sig.AMEngineVersion) AV=$($sig.AntivirusSignatureVersion) AS=$($sig.AntispywareSignatureVersion)")
        $details.Add("Real-time protection: $($sig.RealTimeProtectionEnabled)")
    } catch {
        $details.Add("Get-MpComputerStatus: $_")
    }

    # Full scan scheduled in forensic phase; quick scan here
    try {
        Start-MpScan -ScanType QuickScan -ErrorAction Stop | Out-Null
        $details.Add('Quick scan started.')
    } catch {
        $details.Add("Quick scan: $_")
    }

    # Firewall profiles
    try {
        $profiles = Get-NetFirewallProfile
        foreach ($p in $profiles) {
            if (-not $p.Enabled) {
                Set-NetFirewallProfile -Name $p.Name -Enabled True
                $details.Add("Enabled firewall profile: $($p.Name)")
            } else {
                $details.Add("Firewall profile $($p.Name): enabled")
            }
        }
    } catch {
        $details.Add("Firewall check: $_")
    }

    # Secure Boot / TPM / BitLocker inventory
    try {
        $tpm = Get-CimInstance -Namespace 'root\cimv2\security\microsofttpm' -ClassName Win32_Tpm -ErrorAction SilentlyContinue
        if ($tpm) { $details.Add("TPM present: $($tpm.IsEnabled_InitialValue) / activated: $($tpm.IsActivated_InitialValue)") }
    } catch { }

    try {
        $bl = Get-BitLockerVolume -ErrorAction SilentlyContinue
        foreach ($v in $bl) {
            $details.Add("BitLocker $($v.MountPoint): $($v.VolumeStatus) $($v.ProtectionStatus)")
        }
    } catch {
        $details.Add('BitLocker cmdlets unavailable or no volumes.')
    }

    # Disable risky legacy protocols where cmdlet exists (SMBv1 client)
    try {
        $smb1 = Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -ErrorAction SilentlyContinue
        if ($smb1 -and $smb1.State -eq 'Enabled') {
            Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart -ErrorAction SilentlyContinue | Out-Null
            $details.Add('SMB1 protocol disabled (recommended).')
        } else {
            $details.Add('SMB1 already disabled or not present.')
        }
    } catch { }

    return $details
}

# ---------------------------------------------------------------------------
# Phase 5 — Deep clean
# ---------------------------------------------------------------------------

function Invoke-DeepClean {
    $details = [System.Collections.Generic.List[string]]::new()
    $freedEstimate = 0

    function Clear-Folder {
        param([string] $Path, [string] $Label)
        if (-not (Test-Path $Path)) { return }
        $before = (Get-ChildItem $Path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        Get-ChildItem $Path -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        $script:freedEstimate += [math]::Max(0, $before)
        $details.Add("Cleared $Label")
    }

    Clear-Folder -Path $env:TEMP -Label 'User TEMP'
    Clear-Folder -Path 'C:\Windows\Temp' -Label 'Windows Temp'

    # Edge / Chrome caches (user level)
    $cachePaths = @(
        "$env:LOCALAPPDATA\Microsoft\Windows\INetCache",
        "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
        "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
    )
    foreach ($c in $cachePaths) { Clear-Folder -Path $c -Label $c }

    # Windows Update cache (stop service briefly)
    try {
        Stop-Service wuauserv -Force -ErrorAction SilentlyContinue
        Clear-Folder -Path 'C:\Windows\SoftwareDistribution\Download' -Label 'WU Download cache'
        Start-Service wuauserv -ErrorAction SilentlyContinue
    } catch {
        $details.Add("WU cache clean: $_")
    }

    # DISM component cleanup
    if (Invoke-External -FilePath 'DISM.exe' -ArgumentList @('/Online', '/Cleanup-Image', '/StartComponentCleanup', '/ResetBase') -Label 'DISM StartComponentCleanup') {
        $details.Add('DISM component cleanup completed.')
    } else {
        $details.Add('DISM component cleanup finished with warnings.')
    }

    # Drive error check (helps with crash/freezing issues)
    if (Invoke-External -FilePath 'chkdsk.exe' -ArgumentList @('C:', '/scan') -Label 'chkdsk C: /scan') {
        $details.Add('Drive scan (chkdsk) completed.')
    }

    # Recycle Bin
    try {
        Clear-RecycleBin -Force -ErrorAction Stop
        $details.Add('Recycle Bin emptied.')
    } catch {
        $details.Add("Recycle Bin: $_")
    }

    # DNS cache
    ipconfig /flushdns | Out-Null
    $details.Add('DNS cache flushed.')

    $details.Add("Estimated temp data touched: ~$([math]::Round($freedEstimate / 1MB, 1)) MB (varies).")
    return $details
}

# ---------------------------------------------------------------------------
# Phase 6 — Forensic audit
# ---------------------------------------------------------------------------

function Invoke-ForensicAudit {
    param([string] $OutDir)

    $details = [System.Collections.Generic.List[string]]::new()
    $artifacts = [ordered]@{}

    # System file integrity
    Write-Log 'Running SFC /scannow (can take 15+ minutes)...'
    $sfcLog = Join-Path $OutDir "sfc-$RunStamp.txt"
    $sfc = Start-Process -FilePath 'sfc.exe' -ArgumentList '/scannow' -Wait -PassThru -NoNewWindow `
        -RedirectStandardOutput $sfcLog -RedirectStandardError (Join-Path $OutDir "sfc-err-$RunStamp.txt")
    $artifacts.SFC = @{ ExitCode = $sfc.ExitCode; Log = $sfcLog }
    $details.Add("SFC exit code: $($sfc.ExitCode) — see $sfcLog")

    Write-Log 'Running DISM /RestoreHealth...'
    $dismLog = Join-Path $OutDir "dism-health-$RunStamp.txt"
    $dism = Start-Process -FilePath 'DISM.exe' -ArgumentList '/Online', '/Cleanup-Image', '/RestoreHealth' `
        -Wait -PassThru -NoNewWindow -RedirectStandardOutput $dismLog
    $artifacts.DISM = @{ ExitCode = $dism.ExitCode; Log = $dismLog }
    $details.Add("DISM RestoreHealth exit code: $($dism.ExitCode)")

    # Full Defender scan
    try {
        Write-Log 'Starting Windows Defender full scan...'
        Start-MpScan -ScanType FullScan | Out-Null
        $threats = Get-MpThreatDetection -ErrorAction SilentlyContinue
        $artifacts.DefenderThreats = @($threats | Select-Object ThreatName, InitialDetectionTime, Resources)
        $details.Add("Defender full scan started; recent detections: $($threats.Count)")
    } catch {
        $details.Add("Defender full scan: $_")
    }

    # Autoruns (registry + startup folders + scheduled tasks)
    $autoruns = @()
    $runKeys = @(
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce',
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run',
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce'
    )
    foreach ($rk in $runKeys) {
        if (Test-Path $rk) {
            $props = Get-ItemProperty $rk
            $props.PSObject.Properties | Where-Object { $_.Name -notmatch '^PS' } | ForEach-Object {
                $autoruns += [ordered]@{ Source = $rk; Name = $_.Name; Command = $_.Value }
            }
        }
    }
    $startupFolder = [Environment]::GetFolderPath('Startup')
    Get-ChildItem $startupFolder -ErrorAction SilentlyContinue | ForEach-Object {
        $autoruns += [ordered]@{ Source = 'StartupFolder'; Name = $_.Name; Command = $_.FullName }
    }
    $tasks = Get-ScheduledTask -ErrorAction SilentlyContinue |
        Where-Object { $_.TaskPath -notmatch '\\Microsoft\\' -and $_.State -ne 'Disabled' } |
        Select-Object -First 100 TaskName, TaskPath, State
    $artifacts.Autoruns = $autoruns
    $artifacts.ScheduledTasks = $tasks
    $details.Add("Autorun entries: $($autoruns.Count); non-Microsoft scheduled tasks sampled: $($tasks.Count)")

    # Listening ports + established connections
    $net = Get-NetTCPConnection -State Listen, Established -ErrorAction SilentlyContinue |
        Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess -First 500
    $procMap = @{}
    foreach ($n in $net) {
        if (-not $procMap.ContainsKey($n.OwningProcess)) {
            $procMap[$n.OwningProcess] = (Get-Process -Id $n.OwningProcess -ErrorAction SilentlyContinue).ProcessName
        }
        $n | Add-Member -NotePropertyName ProcessName -NotePropertyValue $procMap[$n.OwningProcess] -Force
    }
    $artifacts.Network = $net
    $details.Add("Network connections captured: $($net.Count)")

    # Recent failed logons / privileged logons (Security log)
    $secEvents = @()
    try {
        $secEvents = Get-WinEvent -FilterHashtable @{
            LogName   = 'Security'
            ID        = 4624, 4625, 4672, 4720, 4722, 4724, 4732
            StartTime = (Get-Date).AddDays(-7)
        } -MaxEvents 200 -ErrorAction Stop
    } catch {
        $details.Add("Security event log: $_ (enable Advanced Audit Policy if empty).")
    }
    $artifacts.SecurityEvents = $secEvents | Select-Object TimeCreated, Id, Message -First 50

    # Suspicious process heuristic: unsigned + unusual path
    $suspicious = @()
    Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Path } | ForEach-Object {
        $p = $_
        if ($p.Path -match '\\Users\\.*\\AppData\\Local\\Temp\\' -or $p.Path -match '\\ProgramData\\[^\\]+\\[^\\]+\.exe$') {
            $suspicious += [ordered]@{ Name = $p.Name; Path = $p.Path; Id = $p.Id }
        }
    }
    $artifacts.SuspiciousProcesses = $suspicious
    $details.Add("Heuristic suspicious processes: $($suspicious.Count)")

    # Export JSON bundle
    $jsonPath = Join-Path $OutDir "forensic-artifacts-$RunStamp.json"
    $artifacts | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonPath -Encoding UTF8
    $details.Add("Forensic JSON: $jsonPath")

    # HTML report
    $display = Get-DisplayProfile
    $html = @"
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>TUF Forensic Report $RunStamp</title>
<style>
body{font-family:Segoe UI,sans-serif;margin:24px;background:#0f1117;color:#e6e6e6}
h1,h2{color:#00d4aa} table{border-collapse:collapse;width:100%;margin:12px 0}
td,th{border:1px solid #333;padding:8px;text-align:left} th{background:#1a1f2e}
.warn{color:#ffb020}.ok{color:#00d4aa}
</style></head><body>
<h1>ASUS TUF Forensic Report</h1>
<p>Generated: $(Get-Date -Format 'u') on $env:COMPUTERNAME</p>
<h2>Display / 144Hz</h2>
<pre>$($display | ConvertTo-Json -Depth 5)</pre>
<h2>Autoruns (sample)</h2>
<table><tr><th>Source</th><th>Name</th><th>Command</th></tr>
$(
    ($autoruns | Select-Object -First 40 | ForEach-Object {
        "<tr><td>$($_.Source)</td><td>$($_.Name)</td><td>$([System.Web.HttpUtility]::HtmlEncode($_.Command))</td></tr>"
    }) -join "`n"
)
</table>
<h2>Suspicious Processes</h2>
<pre>$($suspicious | ConvertTo-Json -Depth 4)</pre>
<h2>Security Events (7 days, sample)</h2>
<pre>$($artifacts.SecurityEvents | ConvertTo-Json -Depth 3)</pre>
<h2>Phase Summary</h2>
<pre>$($Script:PhaseResults | ConvertTo-Json -Depth 4)</pre>
</body></html>
"@
    # HttpUtility may be unavailable on PS 5.1 — fallback encode
    try {
        Add-Type -AssemblyName System.Web
    } catch { }
    if (-not ('System.Web.HttpUtility' -as [type])) {
        $html = $html -replace '\[System\.Web\.HttpUtility\]::HtmlEncode\([^)]+\)', { param($m) $m }
    }
    Set-Content -Path $Script:ReportFile -Value $html -Encoding UTF8
    $details.Add("HTML report: $Script:ReportFile")

    return $details
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

try {
    Initialize-Maintenance

    # Phase 1
    $p1 = Start-Phase 'Display profile (144Hz / Adaptive Sync)'
    $disp = Get-DisplayProfile
    foreach ($line in $disp.GPU) { Write-Log "GPU: $($line.Name) driver $($line.Driver)" }
    foreach ($hz in $disp.CurrentHz) { Write-Log "Active mode: $hz" }
    foreach ($hint in $disp.AdaptiveSyncHint) { Write-Log $hint }
    $hzOk = $true
    if ($Force144Hz) { $hzOk = Set-PrimaryDisplay144Hz -TargetHz 144 }
    Complete-Phase -Phase $p1 -Status OK -Details @(
        "Current: $($disp.CurrentHz -join ', ')",
        $(if ($Force144Hz) { "Force144Hz: $hzOk" } else { 'Force144Hz not requested' })
    )

    # Phase 2
    $p2 = Start-Phase 'Windows Update (COM + USO)'
    $wu = Install-WindowsUpdatesCom
    Complete-Phase -Phase $p2 -Details $wu

    # Phase 3
    $p3 = Start-Phase 'Application updates (winget / choco / ASUS utils)'
    $apps = Update-InstalledApplications
    Complete-Phase -Phase $p3 -Details $apps

    # Phase 4
    $p4 = Start-Phase 'Security (Defender, firewall, hardening)'
    $sec = Invoke-SecurityMaintenance
    Complete-Phase -Phase $p4 -Details $sec

    # Phase 5
    $p5 = Start-Phase 'Deep clean'
    $clean = Invoke-DeepClean
    Complete-Phase -Phase $p5 -Details $clean

    # Phase 6
    if (-not $SkipForensic) {
        $p6 = Start-Phase 'Forensic audit'
        $forensic = Invoke-ForensicAudit -OutDir $ReportPath
        Complete-Phase -Phase $p6 -Details $forensic
    } else {
        Write-Log 'Forensic phase skipped.' -Level WARN
    }

    Write-Log 'Maintenance complete.' -Level OK
    Write-Log "Log file: $Script:LogFile"
    if (-not $SkipForensic) { Write-Log "Forensic HTML: $Script:ReportFile" }

    if (-not $SkipReboot) {
        $pending = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired' -ErrorAction SilentlyContinue)
        if ($pending) {
            Write-Log 'Reboot required for updates. Restarting in 120 seconds (Ctrl+C to abort)...' -Level WARN
            shutdown /r /t 120 /c 'TUF maintenance reboot'
        }
    }
} catch {
    Write-Log "Fatal error: $_" -Level ERROR
    throw
}
