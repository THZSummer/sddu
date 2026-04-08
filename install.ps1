#!/usr/bin/env pwsh
# SDDU Plugin Installer with SDD/SDDU dual distribution support
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1 <TargetDir>

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetDir
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistSdduDir = Join-Path $ScriptDir "dist/sddu"
$DistSddDir = Join-Path $ScriptDir "dist/sdd" 
$DistSdduArchive = Join-Path $ScriptDir "dist/sddu.zip"
$DistSddArchive = Join-Path $ScriptDir "dist/sdd.zip"

Write-Host ""
Write-Host "=== SDDU Plugin Installer ===" -ForegroundColor Cyan
Write-Host "Source: $ScriptDir" 
Write-Host "Target: $TargetDir"
Write-Host ""

# Show migration info
Write-Host "[INFO] SDD to SDDU Migration Support" -ForegroundColor Cyan
Write-Host "This installer supports both SDD and SDDU formats" -ForegroundColor Green
Write-Host "All @sdd-* commands will continue to work for backward compatibility" -ForegroundColor Green
Write-Host "Recommend using @sddu-* commands for new projects" -ForegroundColor Green
Write-Host ""

# Check source
Write-Host "[1/7] Checking source..." -ForegroundColor Cyan
$PackageJsonPath = Join-Path $ScriptDir "package.json"
if (-not (Test-Path $PackageJsonPath)) {
    Write-Host "ERROR: package.json not found" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Source validated" -ForegroundColor Green

# Locate distribution files
Write-Host "[2/7] Locating distribution files..." -ForegroundColor Cyan

if (Test-Path $DistSdduDir) {
    Write-Host "[OK] Found SDDU distribution in dist/sddu/" -ForegroundColor Green
}
elseif (Test-Path $DistSddDir) {
    Write-Host "[OK] Found SDD distribution in dist/sdd/ (using for backward compatibility)" -ForegroundColor Green
    Write-Host "[INFO] Maintaining backward compatibility" -ForegroundColor Yellow
}
else {
    Write-Host "[INFO] Pre-built distribution not found, looking for archives or building..." -ForegroundColor Yellow
    if (Test-Path $DistSdduArchive -or Test-Path $DistSddArchive) {
        # Use SDDU archive first if available
        if (Test-Path $DistSdduArchive) {
            Write-Host "[INFO] SDDU archive found, extracting..." -ForegroundColor Green
            Expand-Archive -Path $DistSdduArchive -DestinationPath "$ScriptDir\dist\tmp_extract_sddu" -Force
            Move-Item -Path "$ScriptDir\dist\tmp_extract_sddu\sddu" -Destination "$ScriptDir\dist\sddu" -Force
            Remove-Item -Path "$ScriptDir\dist\tmp_extract_sddu" -Recurse -Force
            Write-Host "[OK] SDDU archive extracted to dist/sddu/" -ForegroundColor Green
        } elseif (Test-Path $DistSddArchive) {
            Write-Host "[INFO] SDD archive found, extracting..." -ForegroundColor Green
            Expand-Archive -Path $DistSddArchive -DestinationPath "$ScriptDir\dist\tmp_extract" -Force
            Move-Item -Path "$ScriptDir\dist\tmp_extract\sdd" -Destination "$ScriptDir\dist\sdd" -Force
            Remove-Item -Path "$ScriptDir\dist\tmp_extract" -Recurse -Force
            Write-Host "[OK] SDD archive extracted to dist/sdd/" -ForegroundColor Green
        }
    } else {
        Write-Host "[INFO] No pre-built distributions found, building from source..." -ForegroundColor Yellow
        Write-Host "Building from source..." -ForegroundColor Cyan

        # Build agents
        Write-Host "  Building agents..." -ForegroundColor Gray
        & node "$ScriptDir\build-agents.cjs"
        if ($LASTEXITCODE -ne 0) { 
            Write-Host "Agent build failed" -ForegroundColor Red
            exit 1
        }

        # Build TypeScript
        if (Test-Path "$ScriptDir\node_modules") {
            Write-Host "  Building TypeScript..." -ForegroundColor Gray
            & "$ScriptDir\node_modules\.bin\tsc.cmd" --project "$ScriptDir\tsconfig.json"
            if ($LASTEXITCODE -ne 0) { 
                Write-Host "TS build failed" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "  Installing dependencies..." -ForegroundColor Gray
            & npm install --prefix $ScriptDir
            if ($LASTEXITCODE -ne 0) { 
                Write-Host "Install failed" -ForegroundColor Red
                exit 1
            }
            & "$ScriptDir\node_modules\.bin\tsc.cmd" --project "$ScriptDir\tsconfig.json"
            if ($LASTEXITCODE -ne 0) { 
                Write-Host "TS build failed" -ForegroundColor Red
                exit 1
            }
        }
        
        # Run package script
        Write-Host "  Creating distribution packages..." -ForegroundColor Gray
        & node "$ScriptDir\scripts\package.cjs"
        if ($LASTEXITCODE -ne 0) { 
            Write-Host "Package creation failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "[OK] Build completed" -ForegroundColor Green
    }
}

# Create directories - support both .sddu and .sdd
Write-Host "[3/7] Creating directories..." -ForegroundColor Cyan

$directories = @(
    "$TargetDir\.sddu\specs-tree-root",
    "$TargetDir\.sdd\specs-tree-root",
    "$TargetDir\.opencode\plugins\sddu",
    "$TargetDir\.opencode\plugins\sdd", 
    "$TargetDir\.opencode\agents"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "[INFO] Path exists: $dir" -ForegroundColor Yellow
    } else {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "[OK] Created: $dir" -ForegroundColor Green
    }
}

# Copy both SDDU and SDD distributions
Write-Host "[4/7] Copying distribution files..." -ForegroundColor Cyan

Copy-DistributionToPlugin -SourceDir $DistSdduDir -DestDir (Join-Path $TargetDir ".opencode\plugins\sddu") -VersionLabel "SDDU"
Copy-DistributionToPlugin -SourceDir $DistSddDir -DestDir (Join-Path $TargetDir ".opencode\plugins\sdd") -VersionLabel "SDD (backward compatibility)"

# Copy agents from both sources
$agentCount = 0

# Copy SDDU agents first (preferred)
if (Test-Path (Join-Path $DistSdduDir "agents")) {
    Write-Host "  Copying SDDU agents..." -ForegroundColor Gray
    Copy-Item -Path (Join-Path $DistSdduDir "agents\*") -Destination (Join-Path $TargetDir ".opencode\agents\") -Recurse -Force
    $agentCount += (Get-ChildItem -Path (Join-Path $DistSdduDir "agents") -File | Measure-Object).Count
}

# Copy SDD agents (for backward compatibility)
if (Test-Path (Join-Path $DistSddDir "agents")) {
    Write-Host "  Copying SDD agents for backward compatibility..." -ForegroundColor Gray
    Copy-Item -Path (Join-Path $DistSddDir "agents\*") -Destination (Join-Path $TargetDir ".opencode\agents\") -Recurse -Force
    $agentCount += (Get-ChildItem -Path (Join-Path $DistSddDir "agents") -File | Measure-Object).Count
}

Write-Host "[OK] Total agents copied: $agentCount" -ForegroundColor Green

# Get source version
Write-Host "[5/7] Version Detection..." -ForegroundColor Cyan
$sourceVersion = Get-VersionFromPackage -DistSdduDir $DistSdduDir -DistSddDir $DistSddDir
Write-Host "[INFO] Source version: $sourceVersion" -ForegroundColor Green

# Function to get version from package (must define before usage)
function Get-VersionFromPackage {
    param([string]$DistSdduDir, [string]$DistSddDir)
    
    $pkgPath = if (Test-Path $DistSdduDir) { $DistSdduDir } else { $DistSddDir }
    $pkgPath = Join-Path $pkgPath "package.json"
    
    if (Test-Path $pkgPath) {
        $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
        return $pkg.version
    }
    
    return "unknown"
}

function Copy-DistributionToPlugin {
    param([string]$SourceDir, [string]$DestDir, [string]$VersionLabel)
    
    if (Test-Path $SourceDir) {
        Write-Host "  Copying $VersionLabel plugin from $SourceDir..." -ForegroundColor Cyan
        
        # Remove destination if exists
        if (Test-Path $DestDir) { Remove-Item -Path $DestDir -Recurse -Force }
        
        # Create destination directory
        $parentDir = Split-Path $DestDir -Parent
        if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
        
        # Copy everything from source to destination
        Copy-Item -Path "$SourceDir\*" -Destination $DestDir -Recurse
        $fileCount = (Get-ChildItem -Path $DestDir -Recurse | Where-Object {!$_.PSIsContainer} | Measure-Object).Count
        Write-Host "[OK] Copied $fileCount $VersionLabel plugin files" -ForegroundColor Green
    }
    else {
        Write-Host "[INFO] $VersionLabel source not found: $SourceDir" -ForegroundColor Yellow
    }
}

# Set up opencode.json with SDDU + backward compatibility configuration
Write-Host "[6/7] Configuring opencode.json for SDD/SDDU compatibility..." -ForegroundColor Cyan

function Setup-OpencodeConfig {
    param([string]$TargetDir, [string]$ScriptDir)
    
    $opencodeDestPath = Join-Path $TargetDir "opencode.json"
    $opencodeSourceSddu = Join-Path $ScriptDir "dist/sddu/opencode.json"
    $opencodeSourceSdd = Join-Path $ScriptDir "dist/sdd/opencode.json"
    
    # Generate SDDU-based configuration
    $newConfig = @{
        '$schema' = "https://opencode.ai/schemas/opencode.v1.json"
        plugin = @("opencode-sddu-plugin", "opencode-sdd-plugin")
        agent = @{
            "sddu" = "Smart SDDU workflow router agent (recommended)"
            "sdd" = "Smart SDD workflow router agent (backward compatibility)"
            "sddu-help" = "SDDU Help assistant (recommended)"
            "sdd-help" = "SDD Help assistant (backward compatibility)"
            "sddu-discovery" = "SDDU Deep requirement analysis agent (Stage 0/6)"
            "sdd-discovery" = "SDD Deep requirement analysis agent, deprecated (Stage 0/6)"
            "sddu-0-discovery" = "SDDU Requirement Discovery with phase indication (Stage 0/6)"
            "sdd-0-discovery" = "SDD Requirement Discovery, deprecated (Stage 0/6)"
            "sddu-1-spec" = "SDDU Specification expert (Phase 1/6)"
            "sdd-1-spec" = "SDD Specification expert, deprecated (Phase 1/6)"
            "sddu-2-plan" = "SDDU Technical planning expert (Phase 2/6)"
            "sdd-2-plan" = "SDD Technical planning expert, deprecated (Phase 2/6)"
            "sddu-3-tasks" = "SDDU Task breakdown expert (Phase 3/6)"
            "sdd-3-tasks" = "SDD Task breakdown expert, deprecated (Phase 3/6)"
            "sddu-4-build" = "SDDU Implementation expert (Phase 4/6)"
            "sdd-4-build" = "SDD Implementation expert, deprecated (Phase 4/6)"
            "sddu-5-review" = "SDDU Code review expert (Phase 5/6)"
            "sdd-5-review" = "SDD Code review expert, deprecated (Phase 5/6)"
            "sddu-6-validate" = "SDDU Validation expert (Phase 6/6)"
            "sdd-6-validate" = "SDD Validation expert, deprecated (Phase 6/6)"
            "sddu-roadmap" = "SDDU Roadmap planning agent (recommended)"
            "sdd-roadmap" = "SDD Roadmap planning agent, backward compatibility"
            "sddu-docs" = "SDDU Directory navigation generator (recommended)"
            "sdd-docs" = "SDD Directory navigation generator, backward compatibility"
        }
        permission = @("fs", "process", "network")
    }
    
    # If an existing config exists, back it up and merge
    if (Test-Path $opencodeDestPath) {
        Write-Host "[CONFIG MERGE] Backwards compatibility configuration found" -ForegroundColor Cyan
        Copy-Item -Path $opencodeDestPath -Destination "$opencodeDestPath.backup" -Force | Out-Null
        
        # Load current config and merge with SDDU config
        $currentConfig = Get-Content -Path $opencodeDestPath -Raw | ConvertFrom-Json
        
        # Merge plugin list to keep both SDD and SDDU
        $allPlugins = @($currentConfig.plugin | Where-Object { $_ -ne $null })
        $allPlugins += @($newConfig.plugin | Where-Object { $_ -ne $null } | Where-Object { $_ -notin $allPlugins })
        $currentConfig.plugin = $allPlugins | Where-Object { $_ -ne $null } | Select-Object -Unique
        
        # Merge agents: keep existing while adding or updating new
        if (-not $currentConfig.agent) {
            $currentConfig | Add-Member -NotePropertyName "agent" -NotePropertyValue @{} -Force
        }
        
        $newConfig.agent.GetEnumerator() | ForEach-Object {
            if ($currentConfig.agent.$($_.Key)) {
                # Update existing agent definition
                $currentConfig.agent.$($_.Key) = $_.Value
            } else {
                # Add new agent
                $currentConfig.agent | Add-Member -NotePropertyName $_.Key -NotePropertyValue $_.Value -Force
            }
        }
        
        # Set the final configuration
        $finalConfig = $currentConfig
    } else {
        Write-Host "[INFO] Creating new opencode.json with SDD/SDDU config" -ForegroundColor Green
        $finalConfig = $newConfig
    }
    
    $finalConfig | ConvertFrom-Json -Depth 10 | ConvertTo-Json -Depth 10 | Set-Content -Path $opencodeDestPath
    Write-Host "[OK] opencode.json configured for SDD/SDDU compatibility" -ForegroundColor Green
}

Setup-OpencodeConfig -TargetDir $TargetDir -ScriptDir $ScriptDir

# Initialize directory structures for both SDD and SDDU
Write-Host "[7/7] Initializing SDD and SDDU workspace directories..." -ForegroundColor Cyan

# Main .sdd directory
$sddDirPath = Join-Path $TargetDir ".sdd"
if (-not (Test-Path $sddDirPath)) { New-Item -ItemType Directory -Path $sddDirPath -Force | Out-Null }
Set-Content -Path (Join-Path $sddDirPath "README.md") -Value @"
# SDD/SDDU Workspace

## 目录结构

```
.sdd/
├── README.md              # 本文件 - SDD 工作空间说明
├── ROADMAP.md             # 版本路线图
├── docs/                  # 文档目录
├── config.json            # SDD 配置（可选）
└── specs-tree-root/       # 规范文件目录
    ├── README.md          # 目录说明
    └── [feature]/         # Feature 目录
```

## 快速开始

1. 使用 \`@sdd 开始 [feature 名称]\` 或新的 \`@sddu 开始 [feature 名称]\` 开始新 feature
2. 规范文件将自动创建在 \`.sdd/specs-tree-root/\` or \`.sddu/specs-tree-root/\` 目录
3. 文档会自动维护，无需手动创建 README

## SDD 与 SDDU 对照 (Migration Ready)

| SDD 旧版命令 | SDDU 新版命令 | 状态 |
|--------------|---------------|------|
| \`@sdd\` | \`@sddu\` | ✅ 推荐使用 |
| \`@sdd-help\` | \`@sddu-help\` | ✅ 推荐使用 | 
| \`@sdd-xxx\` | \`@sddu-xxx\` | ✅ 推荐使用新命令 |
| \`@sdd-xxx\` | \`@sdd-xxx\` | ⚠️ 继续支持但不推荐 |

**所有 SDD 命令将继续正常工作**用于向后兼容！


## Agents

- \`@sdd\` / \`@sddu\` - 智能入口 (新)
- \`@sdd-docs\` / \`@sddu-docs\` - 目录导航（自动触发）  
- \`@sdd-roadmap\` / \`@sddu-roadmap\` - Roadmap 规划
"@

# SDDU specific directory
$sdduDirPath = Join-Path $TargetDir ".sddu"
if (-not (Test-Path $sdduDirPath)) { New-Item -ItemType Directory -Path $sdduDirPath -Force | Out-Null }
Set-Content -Path (Join-Path $sdduDirPath "README.md") -Value @"
# SDDU Workspace (New Standard)

## 目录结构

```
.sddu/
├── README.md              # 本文件 - SDDU 工作空间说明  
├── ROADMAP.md             # 版本路线图
├── docs/                  # 文档目录  
├── config.json            # SDDU 配置（可选）
└── specs-tree-root/       # 规范文件目录 (SDDU Standard)
    ├── README.md          # 目录说明
    └── specs-tree-[feature]/         # Feature 目录 (SDDU naming)
        ├── spec.md        # 规范文档
        ├── plan.md        # 技术计划  
        ├── tasks.md       # 任务分解
        └── state.json     # 状态文件
```

## Quick Start

1. Use \`@sddu 开始 [feature name]\` to start a new feature
2. Documentation maintains itself (@sddu-docs)

## Migration Status

This project supports both SDD and SDDU workflows:
- ✅ Original SDD commands still work (backward compatibility) 
- ✅ New SDDU commands available (recommended forward path)
- ✅ Mixed usage allowed during transition
"@

# SDD spec-tree root README
$specTreeRootPath = Join-Path $sddDirPath "specs-tree-root"
if (-not (Test-Path $specTreeRootPath)) { New-Item -ItemType Directory -Path $specTreeRootPath -Force | Out-Null }
Set-Content -Path (Join-Path $specTreeRootPath "README.md") -Value @"
# SDD/SDDU 规范目录

## 目录结构

```
.sdd/
├── README.md              # 本文件
├── [feature-1]/           # Feature 1
│   ├── spec.md
│   ├── plan.md
│   ├── tasks.md  
│   └── state.json
├── [feature-2]/           # Feature 2
└── specs-tree-[feature-n]/ # Feature N (SDDU naming convention)
    ├── spec.md
    ├── plan.md
    ├── tasks.md
    ├── discovery.md       # SDDU new discovery phase  
    └── state.json
```

## 使用说明

- 每个 Feature 有独立的目录 (新SDDU命名: specs-tree-[feature])
- SDDU 新增了 discovery.md 文件用于需求挖掘
- 文档会自动维护（@sddu-docs 或 @sdd-docs）
"@

# SDDU spec-tree root README  
$sdduSpecTreeRootPath = Join-Path $sdduDirPath "specs-tree-root"
if (-not (Test-Path $sdduSpecTreeRootPath)) { New-Item -ItemType Directory -Path $sdduSpecTreeRootPath -Force | Out-Null }
Set-Content -Path (Join-Path $sdduSpecTreeRootPath "README.md") -Value @"
# SDDU 规范目录 (New Standard)

## 目录结构

```
.sddu/
├── README.md              # 本文件  
├── specs-tree-root/       # 规范根目录 (SDDU naming convention)
│   ├── README.md          # 本说明文件
│   └── specs-tree-[feature-n]/ # Feature N (SDDU naming convention)
│       ├── discovery.md   # 需求挖掘 (新阶段 0/6)
│       ├── spec.md        # 规范文档
│       ├── plan.md        # 技术计划  
│       ├── tasks.md       # 任务分解
│       ├── build.md       # 任务实现 (阶段 4/6)
│       ├── review.md      # 代码审查 (阶段 5/6)
│       ├── validation.md  # 功能验证 (阶段 6/6)
│       └── state.json     # 状态文件
```

## Quick Start

Use SDDU commands:
- \`@sddu 开始 [feature name]\` - Start new feature
- \`@sddu-discovery [topic]\` - Discover requirements first stage 0/6!
- \`@sddu-spec [feature]\` - Write specification

## Migration Notes

This directory follows the new SDDU standard while maintaining compatibility.
"@

Write-Host "[OK] Created .sdd/ and .sddu/ README files" -ForegroundColor Green

# Calculate final counts
$ssduFileCount = if (Test-Path (Join-Path $TargetDir ".opencode\plugins\sddu")) { (Get-ChildItem -Path (Join-Path $TargetDir ".opencode\plugins\sddu") -Recurse | Where-Object {!$_.PSIsContainer} | Measure-Object).Count } else { 0 }
$sddFileCount = if (Test-Path (Join-Path $TargetDir ".opencode\plugins\sdd")) { (Get-ChildItem -Path (Join-Path $TargetDir ".opencode\plugins\sdd") -Recurse | Where-Object {!$_.PSIsContainer} | Measure-Object).Count } else { 0 }

Write-Host ""
Write-Host "=== SDDU Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Installed to: $TargetDir"
Write-Host ""

Write-Host "Files:" -ForegroundColor White
Write-Host "  - .opencode/plugins/sddu/ ($ssduFileCount files from SDDU dist/)" -ForegroundColor White
Write-Host "  - .opencode/plugins/sdd/ ($sddFileCount files from SDD dist/ for backward compatibility)" -ForegroundColor White
Write-Host "  - .opencode/agents/ ($agentCount agents - includes both SDD and SDDU for compatibility)" -ForegroundColor White
Write-Host "  - opencode.json (plugin configuration - with SDDU+SDD dual support)" -ForegroundColor White
Write-Host "  - .sdd/ and .sddu/ (workspace containers)" -ForegroundColor White

Write-Host ""
Write-Host "  🎉 NEW Feature: Stage 0 (Discovery phase) is now available!" -ForegroundColor Yellow
Write-Host "    - @sddu-discovery / @sdd-discovery - Deep requirement analysis (Stage 0/6)" -ForegroundColor Yellow
Write-Host "    - @sddu-0-discovery / @sdd-0-discovery - Full name version" -ForegroundColor Yellow
Write-Host ""
Write-Host "Recommended Commands (SDDU):" -ForegroundColor Cyan
Write-Host "    @sddu              - Smart entry point (recommended)"
Write-Host "    @sddu-help         - Help assistant (recommended)"
Write-Host "    @sddu-discovery    - Requirement Discovery (Stage 0/6, recommended)"
Write-Host "    @sddu-0-discovery  - Requirement Discovery full name (Stage 0/6, recommended)"
Write-Host "    @sddu-1-spec       - Specification (Phase 1/6, recommended)"  
Write-Host "    @sddu-2-plan       - Technical planning (Phase 2/6, recommended)"
Write-Host "    @sddu-3-tasks      - Task breakdown (Phase 3/6, recommended)"
Write-Host "    @sddu-4-build      - Implementation (Phase 4/6, recommended)"
Write-Host "    @sddu-5-review     - Code review (Phase 5/6, recommended)"
Write-Host "    @sddu-6-validate   - Validation (Phase 6/6, recommended)"
Write-Host ""
Write-Host "Legacy commands (SDD, backward compatible): " -ForegroundColor Gray
Write-Host "    @sdd              - Smart entry point"
Write-Host "    @sdd-help         - Help assistant"  
Write-Host "    @sdd-discovery    - Requirement Discovery (Stage 0/6)"
Write-Host "    @sdd-0-discovery  - Requirement Discovery full name (Stage 0/6)"
Write-Host "    @sdd-1-spec       - Specification (Phase 1/6)"
Write-Host "    ... and others"
Write-Host "  All legacy commands continue to work unchanged!"
Write-Host ""
Write-Host "Quick Start Options:" -ForegroundColor Cyan
Write-Host "  cd '$TargetDir'"
Write-Host "  opencode"
Write-Host "  For SDDU (new): @sddu 开始 [feature name]"
Write-Host "  For SDD (legacy): @sdd 开始 [feature name] (still works!)"
Write-Host "  For discovery: @sddu-discovery [topic] or @sdd-discovery [topic]" 
Write-Host ""
Write-Host "Migration Information:" -ForegroundColor Gray -BackgroundColor Black
Write-Host "  - SDDU is the new recommended approach" -ForegroundColor Gray -BackgroundColor Black
Write-Host "  - SDD commands will continue to work (backward compatibility)" -ForegroundColor Gray -BackgroundColor Black
Write-Host "  - Gradual migration is supported" -ForegroundColor Gray -BackgroundColor Black
Write-Host "  - Mixed use of both systems is acceptable" -ForegroundColor Gray -BackgroundColor Black
Write-Host ""
Write-Host "✅ Installation complete. Ready to start your specifications!" -ForegroundColor Green
Write-Host ""