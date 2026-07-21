<#
.SYNOPSIS
    Full "front and back" system maintenance for a 2026 ASUS TUF Gaming (144Hz adaptive-sync) Windows PC.

.DESCRIPTION
    One-shot maintenance runner that performs, in order:
      1. Preflight        - admin self-elevation, transcript logging, restore point.
      2. Display check    - verifies the panel is actually running at 144Hz and reports
                            adaptive-sync (G-SYNC / FreeSync) capable GPU drivers.
      3. Windows Update   - installs ALL pending OS + driver updates (PSWindowsUpdate module,
                            with a pure COM fallback via Microsoft.Update.Session).
      4. App updates      - upgrades every app winget knows about, and triggers a Microsoft
                            Store update scan through the MDM CIM/COM bridge.
      5. Security         - refreshes Defender signatures, runs a full antivirus scan,
                            and verifies firewall / Secure Boot state.
      6. Deep clean       - SFC, DISM component-store repair + cleanup, temp/DNS/thumbnail
                            cache purge, Windows Update cache reset.
      7. Forensic sweep   - snapshots processes, services, network connections, autoruns,
                            scheduled tasks, local users, installed software, recent
                            Security/System event logs, and Defender detections into a
                            timestamped report folder for later review.

.NOTES
    Run from an elevated PowerShell:  .\asus_tuf_full_system_maintenance.ps1
    Optional switches let you skip long phases, e.g.:
        .\asus_tuf_full_system_maintenance.ps1 -SkipDefenderFullScan
    ASUS-specific firmware/utility updates (BIOS, Armoury Crate, MyASUS) can only be
    delivered through MyASUS / Armoury Crate themselves; this script launches MyASUS
    update check if it is installed.
#>

[CmdletBinding()]
param(
    [switch]$SkipWindowsUpdate,
    [switch]$SkipAppUpdates,
    [switch]$SkipDefenderFullScan,
    [switch]$SkipDeepClean,
    [switch]$SkipForensics,
    [string]$ReportRoot = "$env:SystemDrive\TUF_Maintenance"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

# ---------------------------------------------------------------------------
# 0. Preflight: self-elevate, logging, restore point
# ---------------------------------------------------------------------------
$identity  = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host 'Not elevated - relaunching as Administrator...' -ForegroundColor Yellow
    $argList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
    foreach ($kv in $PSBoundParameters.GetEnumerator()) {
        if ($kv.Value -is [switch]) {
            if ($kv.Value.IsPresent) { $argList += "-$($kv.Key)" }
        } else {
            $argList += @("-$($kv.Key)", "`"$($kv.Value)`"")
        }
    }
    Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -Verb RunAs
    exit
}

$stamp     = Get-Date -Format 'yyyyMMdd_HHmmss'
$reportDir = Join-Path $ReportRoot $stamp
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
Start-Transcript -Path (Join-Path $reportDir 'maintenance_transcript.log') -Force | Out-Null

function Write-Phase([string]$Text) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ('=' * 70) -ForegroundColor Cyan
}

Write-Phase 'PHASE 0: Preflight'
Write-Host "Report folder: $reportDir"
try {
    Enable-ComputerRestore -Drive "$env:SystemDrive\" -ErrorAction SilentlyContinue
    Checkpoint-Computer -Description "TUF maintenance $stamp" -RestorePointType MODIFY_SETTINGS -ErrorAction Stop
    Write-Host 'System restore point created.' -ForegroundColor Green
} catch {
    Write-Warning "Could not create restore point: $($_.Exception.Message)"
}

# ---------------------------------------------------------------------------
# 1. Display / 144Hz adaptive-sync verification
# ---------------------------------------------------------------------------
Write-Phase 'PHASE 1: Display & adaptive-sync check (144Hz)'
$gpus = Get-CimInstance -ClassName Win32_VideoController
foreach ($gpu in $gpus) {
    Write-Host ("GPU: {0} | Driver: {1} ({2})" -f $gpu.Name, $gpu.DriverVersion, $gpu.DriverDate)
    Write-Host ("     Current mode: {0}x{1} @ {2}Hz" -f $gpu.CurrentHorizontalResolution,
                $gpu.CurrentVerticalResolution, $gpu.CurrentRefreshRate)
    if ($gpu.CurrentRefreshRate -and $gpu.CurrentRefreshRate -lt 144) {
        Write-Warning (("Panel is running below 144Hz ({0}Hz). Set it in Settings > System > Display > " +
                        "Advanced display, and enable Adaptive Sync / FreeSync in Armoury Crate or the GPU control panel.") -f
                        $gpu.CurrentRefreshRate)
    }
}
$gpus | Select-Object Name, DriverVersion, DriverDate, CurrentHorizontalResolution,
        CurrentVerticalResolution, CurrentRefreshRate |
    Export-Csv -Path (Join-Path $reportDir 'display_gpu_state.csv') -NoTypeInformation

# ---------------------------------------------------------------------------
# 2. Windows Update (OS + drivers) - PSWindowsUpdate with COM fallback
# ---------------------------------------------------------------------------
if (-not $SkipWindowsUpdate) {
    Write-Phase 'PHASE 2: Windows Update (OS, security patches, drivers)'
    $psWindowsUpdateOk = $false
    try {
        if (-not (Get-Module -ListAvailable -Name PSWindowsUpdate)) {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force -ErrorAction Stop | Out-Null
            Install-Module -Name PSWindowsUpdate -Force -Scope AllUsers -ErrorAction Stop
        }
        Import-Module PSWindowsUpdate -ErrorAction Stop
        # Include Microsoft Update (drivers, Office, etc.), not just Windows Update
        Add-WUServiceManager -MicrosoftUpdate -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
        Get-WindowsUpdate -MicrosoftUpdate -AcceptAll -Install -IgnoreReboot -Verbose |
            Tee-Object -FilePath (Join-Path $reportDir 'windows_update_results.log')
        $psWindowsUpdateOk = $true
    } catch {
        Write-Warning "PSWindowsUpdate path failed ($($_.Exception.Message)); falling back to COM."
    }

    if (-not $psWindowsUpdateOk) {
        # Pure COM fallback using the Windows Update Agent object model
        try {
            $session    = New-Object -ComObject 'Microsoft.Update.Session'
            $searcher   = $session.CreateUpdateSearcher()
            Write-Host 'Searching for updates via COM (Microsoft.Update.Session)...'
            $result     = $searcher.Search("IsInstalled=0 and IsHidden=0")
            if ($result.Updates.Count -eq 0) {
                Write-Host 'No pending updates found.' -ForegroundColor Green
            } else {
                $toInstall = New-Object -ComObject 'Microsoft.Update.UpdateColl'
                foreach ($update in $result.Updates) {
                    Write-Host ("Pending: " + $update.Title)
                    if (-not $update.EulaAccepted) { $update.AcceptEula() }
                    [void]$toInstall.Add($update)
                }
                $downloader         = $session.CreateUpdateDownloader()
                $downloader.Updates = $toInstall
                [void]$downloader.Download()
                $installer          = $session.CreateUpdateInstaller()
                $installer.Updates  = $toInstall
                $installResult      = $installer.Install()
                Write-Host ("Install result code: {0} | Reboot required: {1}" -f
                            $installResult.ResultCode, $installResult.RebootRequired)
            }
        } catch {
            Write-Warning "COM Windows Update failed: $($_.Exception.Message)"
        }
    }
} else { Write-Host 'Windows Update phase skipped by switch.' -ForegroundColor DarkYellow }

# ---------------------------------------------------------------------------
# 3. Application updates: winget + Microsoft Store + ASUS utilities
# ---------------------------------------------------------------------------
if (-not $SkipAppUpdates) {
    Write-Phase 'PHASE 3: Application updates (winget, Microsoft Store, ASUS)'

    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host 'Upgrading all winget-managed apps...'
        winget upgrade --all --include-unknown --accept-source-agreements --accept-package-agreements --silent |
            Tee-Object -FilePath (Join-Path $reportDir 'winget_upgrade.log')
    } else {
        Write-Warning 'winget not found - install "App Installer" from the Microsoft Store.'
    }

    # Trigger a Microsoft Store update scan through the MDM CIM bridge (COM/WMI based)
    try {
        $namespace = 'root\cimv2\mdm\dmmap'
        $className = 'MDM_EnterpriseModernAppManagement_AppManagement01'
        Get-CimInstance -Namespace $namespace -ClassName $className -ErrorAction Stop |
            Invoke-CimMethod -MethodName UpdateScanMethod | Out-Null
        Write-Host 'Microsoft Store update scan triggered.' -ForegroundColor Green
    } catch {
        Write-Warning "Store update scan unavailable: $($_.Exception.Message)"
    }

    # ASUS: BIOS / Armoury Crate / MyASUS updates flow through MyASUS itself
    $myAsus = Get-AppxPackage -Name 'B9ECED6F.MyASUS' -ErrorAction SilentlyContinue
    if ($myAsus) {
        Write-Host 'Launching MyASUS so its Live Update can check for BIOS/driver/firmware updates...'
        Start-Process 'shell:AppsFolder\B9ECED6F.MyASUS_qmba6cd70vzyy!App' -ErrorAction SilentlyContinue
    } else {
        Write-Warning 'MyASUS not detected. For TUF BIOS/firmware updates install MyASUS or use Armoury Crate.'
    }
} else { Write-Host 'App update phase skipped by switch.' -ForegroundColor DarkYellow }

# ---------------------------------------------------------------------------
# 4. Security: Defender signatures + full scan, firewall, Secure Boot
# ---------------------------------------------------------------------------
Write-Phase 'PHASE 4: Security updates & antivirus scan'
try {
    Update-MpSignature -ErrorAction Stop
    Write-Host 'Defender signatures updated.' -ForegroundColor Green
} catch { Write-Warning "Signature update failed: $($_.Exception.Message)" }

Get-NetFirewallProfile |
    Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction |
    Tee-Object -FilePath (Join-Path $reportDir 'firewall_profiles.txt') | Format-Table -AutoSize

try {
    $secureBoot = Confirm-SecureBootUEFI -ErrorAction Stop
    Write-Host "Secure Boot enabled: $secureBoot"
} catch { Write-Warning 'Secure Boot state could not be read (legacy BIOS or insufficient rights).' }

if (-not $SkipDefenderFullScan) {
    Write-Host 'Starting Microsoft Defender FULL scan (this can take a long time)...'
    try {
        Start-MpScan -ScanType FullScan -ErrorAction Stop
        Write-Host 'Defender full scan completed.' -ForegroundColor Green
    } catch { Write-Warning "Defender scan failed: $($_.Exception.Message)" }
} else {
    Write-Host 'Full Defender scan skipped by switch - running quick scan instead.'
    Start-MpScan -ScanType QuickScan -ErrorAction SilentlyContinue
}

# ---------------------------------------------------------------------------
# 5. Deep clean: system file repair + cache/temp purge ("front and back")
# ---------------------------------------------------------------------------
if (-not $SkipDeepClean) {
    Write-Phase 'PHASE 5: Deep clean & integrity repair'

    Write-Host 'Running SFC /scannow (system file checker)...'
    sfc.exe /scannow

    Write-Host 'Running DISM health scan + repair...'
    dism.exe /Online /Cleanup-Image /ScanHealth
    dism.exe /Online /Cleanup-Image /RestoreHealth
    Write-Host 'Cleaning superseded component-store payloads...'
    dism.exe /Online /Cleanup-Image /StartComponentCleanup

    Write-Host 'Purging temp folders, DNS cache, and thumbnail caches...'
    $tempTargets = @(
        $env:TEMP,
        "$env:SystemRoot\Temp",
        "$env:LOCALAPPDATA\Microsoft\Windows\Explorer"  # thumbnail caches
    )
    foreach ($target in $tempTargets) {
        if (Test-Path $target) {
            Get-ChildItem -Path $target -Force -ErrorAction SilentlyContinue |
                Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    ipconfig.exe /flushdns | Out-Null

    Write-Host 'Resetting Windows Update download cache...'
    Stop-Service -Name wuauserv, bits -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$env:SystemRoot\SoftwareDistribution\Download\*" -Recurse -Force -ErrorAction SilentlyContinue
    Start-Service -Name bits, wuauserv -ErrorAction SilentlyContinue

    Write-Host 'Deep clean complete.' -ForegroundColor Green
} else { Write-Host 'Deep clean phase skipped by switch.' -ForegroundColor DarkYellow }

# ---------------------------------------------------------------------------
# 6. Forensic sweep: full-system evidence snapshot
# ---------------------------------------------------------------------------
if (-not $SkipForensics) {
    Write-Phase 'PHASE 6: Forensic snapshot'
    $forensics = Join-Path $reportDir 'forensics'
    New-Item -ItemType Directory -Path $forensics -Force | Out-Null

    Write-Host 'Collecting system inventory...'
    Get-ComputerInfo | Out-File (Join-Path $forensics 'computer_info.txt')
    Get-HotFix | Sort-Object InstalledOn -Descending |
        Export-Csv (Join-Path $forensics 'installed_hotfixes.csv') -NoTypeInformation

    Write-Host 'Collecting running processes (with hashes and command lines)...'
    Get-CimInstance Win32_Process |
        Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, CommandLine, CreationDate |
        Export-Csv (Join-Path $forensics 'processes.csv') -NoTypeInformation
    Get-Process | Where-Object Path | Select-Object -ExpandProperty Path -Unique |
        ForEach-Object { Get-FileHash -Path $_ -Algorithm SHA256 -ErrorAction SilentlyContinue } |
        Export-Csv (Join-Path $forensics 'process_image_hashes.csv') -NoTypeInformation

    Write-Host 'Collecting services, drivers, and scheduled tasks...'
    Get-CimInstance Win32_Service |
        Select-Object Name, DisplayName, State, StartMode, StartName, PathName |
        Export-Csv (Join-Path $forensics 'services.csv') -NoTypeInformation
    driverquery.exe /v /fo csv | Out-File (Join-Path $forensics 'drivers.csv')
    Get-ScheduledTask | Select-Object TaskPath, TaskName, State,
        @{n='Actions';e={($_.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join '; '}} |
        Export-Csv (Join-Path $forensics 'scheduled_tasks.csv') -NoTypeInformation

    Write-Host 'Collecting autoruns (Run keys, startup folders)...'
    $runKeys = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce'
    )
    $runKeys | ForEach-Object {
        if (Test-Path $_) { "[$_]"; Get-ItemProperty -Path $_ | Out-String }
    } | Out-File (Join-Path $forensics 'autoruns_registry.txt')
    Get-CimInstance Win32_StartupCommand |
        Select-Object Name, Command, Location, User |
        Export-Csv (Join-Path $forensics 'startup_commands.csv') -NoTypeInformation

    Write-Host 'Collecting network state...'
    Get-NetTCPConnection -ErrorAction SilentlyContinue |
        Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess,
        @{n='Process';e={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}} |
        Export-Csv (Join-Path $forensics 'tcp_connections.csv') -NoTypeInformation
    Get-DnsClientCache -ErrorAction SilentlyContinue |
        Export-Csv (Join-Path $forensics 'dns_cache.csv') -NoTypeInformation
    arp.exe -a | Out-File (Join-Path $forensics 'arp_table.txt')

    Write-Host 'Collecting accounts and installed software...'
    Get-LocalUser | Select-Object Name, Enabled, LastLogon, PasswordLastSet |
        Export-Csv (Join-Path $forensics 'local_users.csv') -NoTypeInformation
    Get-LocalGroupMember -Group 'Administrators' -ErrorAction SilentlyContinue |
        Export-Csv (Join-Path $forensics 'administrators_group.csv') -NoTypeInformation
    $uninstallKeys = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    Get-ItemProperty -Path $uninstallKeys -ErrorAction SilentlyContinue |
        Where-Object DisplayName |
        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate |
        Sort-Object DisplayName |
        Export-Csv (Join-Path $forensics 'installed_software.csv') -NoTypeInformation

    Write-Host 'Exporting recent event logs (Security, System, Application, Defender)...'
    $since = (Get-Date).AddDays(-14)
    foreach ($log in 'Security', 'System', 'Application', 'Microsoft-Windows-Windows Defender/Operational') {
        $safeName = ($log -replace '[\\/]', '_')
        Get-WinEvent -FilterHashtable @{ LogName = $log; StartTime = $since } -ErrorAction SilentlyContinue |
            Select-Object TimeCreated, Id, LevelDisplayName, ProviderName, Message |
            Export-Csv (Join-Path $forensics "eventlog_$safeName.csv") -NoTypeInformation
    }

    Write-Host 'Collecting Defender detection history...'
    Get-MpThreatDetection -ErrorAction SilentlyContinue |
        Export-Csv (Join-Path $forensics 'defender_detections.csv') -NoTypeInformation
    Get-MpComputerStatus | Out-File (Join-Path $forensics 'defender_status.txt')

    Write-Host "Forensic snapshot saved to: $forensics" -ForegroundColor Green
} else { Write-Host 'Forensic phase skipped by switch.' -ForegroundColor DarkYellow }

# ---------------------------------------------------------------------------
# 7. Wrap-up
# ---------------------------------------------------------------------------
Write-Phase 'DONE'
Write-Host "All phases finished. Full report: $reportDir" -ForegroundColor Green
$rebootPending = Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired'
if ($rebootPending) {
    Write-Warning 'A reboot is required to finish installing updates. Restart when convenient.'
}
Stop-Transcript | Out-Null
