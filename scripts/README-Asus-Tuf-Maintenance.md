# ASUS TUF Gaming — System Maintenance Script (2026)

PowerShell maintenance toolkit for **Windows 10/11** ASUS TUF laptops/desktops with **144Hz Adaptive Sync** panels.

## What it does

| Phase | Action |
|-------|--------|
| Display | Reports GPU/driver, supported monitor modes (WMI), current refresh rate; optional `-Force144Hz` |
| Windows Update | COM `Microsoft.Update.Session` + `UsoClient` fallback |
| Apps | `winget upgrade --all`, optional Chocolatey, ASUS/NVIDIA/AMD utilities |
| Security | Defender signatures, quick scan, firewall, SMB1 disable, TPM/BitLocker inventory |
| Deep clean | Temp folders, browser caches, WU cache, DISM cleanup, Disk Cleanup, DNS flush |
| Forensics | `sfc /scannow`, `DISM /RestoreHealth`, Defender full scan, autoruns, network, Security log, HTML + JSON report |

## Requirements

- **Run as Administrator** (script auto-elevates)
- Windows 10/11 with PowerShell 5.1+
- Internet access for updates
- `winget` (App Installer from Microsoft Store) recommended

## Quick start

1. Copy `Asus-Tuf-SystemMaintenance-2026.ps1` to the PC (e.g. `C:\Scripts\`).
2. Open **PowerShell as Administrator**.
3. Allow script execution once:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

4. Run full maintenance + forensics + force 144Hz:

```powershell
C:\Scripts\Asus-Tuf-SystemMaintenance-2026.ps1 -Force144Hz
```

5. Reports land in `%USERPROFILE%\Desktop\TUF-Maintenance-Reports\`.

## Useful switches

```powershell
# Updates + clean only (no SFC/full scan — faster)
.\Asus-Tuf-SystemMaintenance-2026.ps1 -SkipForensic

# Custom report folder, no auto-reboot prompt
.\Asus-Tuf-SystemMaintenance-2026.ps1 -ReportPath D:\Forensics -SkipReboot
```

## 144Hz & Adaptive Sync notes

- **144Hz**: `-Force144Hz` uses `ChangeDisplaySettings` when a 144Hz mode exists at the current resolution.
- **Adaptive Sync** (FreeSync/G-Sync): enable in **AMD Adrenalin** or **NVIDIA Control Panel**, and in **Armoury Crate / MyASUS** or laptop BIOS if available. The script logs vendor-specific reminders; panel VRR cannot be toggled reliably via generic COM alone.

## Forensic output

- `maintenance-*.log` — full run log
- `forensic-artifacts-*.json` — autoruns, network, events, threats
- `forensic-report-*.html` — human-readable summary
- `sfc-*.txt`, `dism-health-*.txt` — integrity scan logs

Review **Suspicious Processes** and **Autoruns** in the HTML report. Escalate unexpected entries with your security team or Windows Defender Offline if needed.

## Safety

- Expect **long runtime** (30–90+ minutes with SFC, full Defender scan, and large updates).
- **Reboot** may be scheduled automatically if Windows Update requires it (`-SkipReboot` to disable).
- For a simpler one-paste fix, use `Fix-My-PC.ps1` instead.
