#!/usr/bin/env pwsh
# SDD Plugin Installer with new distribution support
# Usage: powershell -ExecutionPolicy Bypass -File install.ps1 <TargetDir>

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetDir
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistSddDir = Join-Path $ScriptDir "dist/sdd"
$DistArchive = Join-Path $ScriptDir "dist/sdd.zip"

Write-Host ""
Write-Host "=== SDD Plugin Installer ===" -ForegroundColor Cyan
Write-Host "Source: $ScriptDir"
Write-Host "Target: $TargetDir"
Write-Host ""

# Step 1: Check source
Write-Host "[1/6] Checking source..." -ForegroundColor Cyan
if (-not (Test-Path "$ScriptDir\package.json")) {
    Write-Host "ERROR: package.json not found" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Source validated" -ForegroundColor Green

# Step 2: Locate or create distribution files
Write-Host "[2/6] Locating distribution files..." -ForegroundColor Cyan

if (Test-Path $DistSddDir) {
    Write-Host "[OK] Using pre-built distribution in dist/sdd/" -ForegroundColor Green
} else {
    Write-Host "[INFO] No pre-built dist/sdd/ directory found, checking for archive..." -ForegroundColor Yellow
    if (Test-Path $DistArchive) {
        Write-Host "[INFO] Archive found at $DistArchive, extracting..." -ForegroundColor Green
        Expand-Archive -Path $DistArchive -DestinationPath "$ScriptDir\dist\tmp_extract" -Force
        Move-Item -Path "$ScriptDir\dist\tmp_extract\sdd" -Destination "$ScriptDir\dist\sdd" -Force
        Remove-Item -Path "$ScriptDir\dist\tmp_extract" -Recurse -Force
        Write-Host "[OK] Archive extracted to dist/sdd/" -ForegroundColor Green
    } else {
        Write-Host "[WARN] No pre-built dist/sdd/ or dist/sdd.zip found. Building from source..." -ForegroundColor Yellow
        
        # Build agents
        Write-Host "  Building agents..." -ForegroundColor Gray
        & node "$ScriptDir\build-agents.cjs"
        if ($LASTEXITCODE -ne 0) { Write-Host "Agent build failed" -ForegroundColor Red; exit 1 }

        # Build TypeScript
        if (Test-Path "$ScriptDir\node_modules") {
            Write-Host "  Building TypeScript..." -ForegroundColor Gray
            & "$ScriptDir\node_modules\.bin\tsc.cmd" --project "$ScriptDir\tsconfig.json"
            if ($LASTEXITCODE -ne 0) { Write-Host "TS build failed" -ForegroundColor Red; exit 1 }
        } else {
            Write-Host "  Installing dependencies..." -ForegroundColor Gray
            & npm install --prefix $ScriptDir
            if ($LASTEXITCODE -ne 0) { Write-Host "Install failed" -ForegroundColor Red; exit 1 }
            & "$ScriptDir\node_modules\.bin\tsc.cmd" --project "$ScriptDir\tsconfig.json"
            if ($LASTEXITCODE -ne 0) { Write-Host "TS build failed" -ForegroundColor Red; exit 1 }
        }

        # Run packaging script to create dist/sdd/
        Write-Host "  Creating distribution packages..." -ForegroundColor Gray
        & node "$ScriptDir\scripts\package.cjs"
        if ($LASTEXITCODE -ne 0) { Write-Host "Package creation failed" -ForegroundColor Red; exit 1 }
        
        Write-Host "[OK] Build complete, distribution packages created" -ForegroundColor Green
    }
}

# Step 3: Create directories
Write-Host "[3/6] Creating directories..." -ForegroundColor Cyan
$dirs = @(
    "$TargetDir\.opencode\plugins\sdd",
    "$TargetDir\.opencode\agents",
    "$TargetDir\.sdd",
    "$TargetDir\.sdd\specs-tree-root"
)
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "[WARN] Exists: $dir" -ForegroundColor Yellow
    } else {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "[OK] Created: $dir" -ForegroundColor Green
    }
}

# Step 4: Copy plugin from dist/sdd/ 
Write-Host "[4/6] Copying plugin from dist/sdd/..." -ForegroundColor Cyan
$pluginDest = "$TargetDir\.opencode\plugins\sdd"
# Clean destination first
if (Test-Path $pluginDest) { Remove-Item $pluginDest -Recurse -Force }
New-Item -ItemType Directory -Force -Path $pluginDest | Out-Null
if (Test-Path "$DistSddDir\src") {
    Get-ChildItem "$DistSddDir\src" | Copy-Item -Destination $pluginDest -Recurse -Force
}
$fileCount = (Get-ChildItem "$TargetDir\.opencode\plugins\sdd" -Recurse | Measure-Object).Count

# Copy agents from dist/sdd/agents/ to .opencode/agents/
Write-Host "  Copying agents..." -ForegroundColor Gray
if (Test-Path "$DistSddDir\agents") {
    Copy-Item "$DistSddDir\agents\*" -Destination "$TargetDir\.opencode\agents\" -Force
    $agentCount = (Get-ChildItem "$TargetDir\.opencode\agents" -File | Measure-Object).Count
} else {
    Write-Host "  [WARN] No agents found in dist/sdd/agents/, checking alternatives..." -ForegroundColor Yellow
    $agentFiles = Get-ChildItem -Recurse -Path "$DistSddDir" -Filter "*.md" | Where-Object { $_.FullName -like "*agents*" }
    if ($agentFiles.Count -gt 0) {
        $agentFiles | ForEach-Object {
            Copy-Item $_.FullName -Destination "$TargetDir\.opencode\agents\" -Force
        }
        $agentCount = (Get-ChildItem "$TargetDir\.opencode\agents" -File | Measure-Object).Count 
    } else {
        $agentCount = 0
    }
}

Write-Host "[OK] Copied $fileCount plugin files + $agentCount agents" -ForegroundColor Green

# Step 5: Copy or merge opencode.json 
Write-Host "[5/6] Configuring opencode.json..." -ForegroundColor Cyan

# Try to locate opencode.json in dist/sdd/
$targetOpencodePath = "$TargetDir\opencode.json"
$opencodeSource = $null

# First look for opencode.json in the new dist/sdd directory
if (Test-Path "$DistSddDir\opencode.json") {
    $opencodeSource = "$DistSddDir\opencode.json"
} elseif (Test-Path "$DistSddDir\..\opencode.json") {
    # Alternative location
    $opencodeSource = "$DistSddDir\..\opencode.json"
}

if (Test-Path $targetOpencodePath) {
    Write-Host "[CONFIG MERGE] Existing opencode.json found" -ForegroundColor Cyan
    Write-Host "✅ Merging configuration..." -ForegroundColor Green
    
    # Backup existing config
    Copy-Item $targetOpencodePath "$targetOpencodePath.backup" -Force
    
    # Attempt to merge config (PowerShell doesn't have native JSON merging, use a simple approach for now)
    if ($opencodeSource -and (Test-Path $opencodeSource)) {
        $existingConfig = Get-Content $targetOpencodePath | ConvertFrom-Json
        $newConfig = Get-Content $opencodeSource | ConvertFrom-Json
        
        # Merge plugins (deduplicate)
        $allPlugins = @($existingConfig.plugin | Where-Object { $null -ne $_ })
        $allPlugins += @($newConfig.plugin | Where-Object { $null -ne $_ } | Where-Object { $_ -notin $allPlugins })
        $existingConfig.plugin = $allPlugins | Where-Object { $null -ne $_ } | Sort-Object -Unique
        
        # Merge agents
        if ($newConfig.agent) {
            if (-not $existingConfig.agent) { $existingConfig | Add-Member -MemberType NoteProperty -Name "agent" -Value @{} }
            $newConfig.agent.psobject.properties | ForEach-Object {
                $existingConfig.agent | Add-Member -MemberType NoteProperty -Name $_.Name -Value $_.Value -Force
            }
        }
        
        # Merge or keep permissions
        if ($newConfig.permission) {
            if (-not $existingConfig.permission) {
                $existingConfig | Add-Member -MemberType NoteProperty -Name "permission" -Value $newConfig.permission
            }
        }
        
        # Always keep schema if available in new config
        if ($newConfig.PSObject.Properties.Name -contains '$schema') {
            $existingConfig | Add-Member -MemberType NoteProperty -Name "`$schema" -Value $newConfig.'$schema' -Force
        }
        
        ConvertTo-Json $existingConfig -Depth 10 | Set-Content $targetOpencodePath
        Write-Host "✅ Configuration merged successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Source opencode.json not found, keeping existing" -ForegroundColor Yellow
    }
} else {
    if ($opencodeSource -and (Test-Path $opencodeSource)) {
        Copy-Item $opencodeSource -Destination $targetOpencodePath -Force
        Write-Host "[OK] Copied opencode.json" -ForegroundColor Green
    } else {
        Write-Host "WARNING: No opencode.json found to copy!" -ForegroundColor Red
        Write-Host "Creating minimal opencode.json configuration..." -ForegroundColor Yellow
        # Create default configuration
        @{
            '$schema' = "https://opencode.ai/schemas/opencode.v1.json"
            plugin = @("opencode-sdd-plugin")
            agent = @{
                "sdd" = "Smart SDD workflow router agent"
                "sdd-0-discovery" = "Deep requirement analysis agent"
                "sdd-1-spec" = "Specification expert"
                "sdd-2-plan" = "Technical planning expert"
                "sdd-3-tasks" = "Task breakdown expert"
                "sdd-4-build" = "Implementation expert"
                "sdd-5-review" = "Code review expert"
                "sdd-6-validate" = "Validation expert"
                "sdd-roadmap" = "Roadmap planning"
                "sdd-docs" = "Directory navigation generator"
            }
            permission = @("fs", "process", "network")
        } | ConvertTo-Json -Depth 10 | Set-Content $targetOpencodePath
        Write-Host "[OK] Created minimal opencode.json" -ForegroundColor Green
    }
}

# Step 6: Initialize .sdd/ directory structure
Write-Host "[6/6] Initializing .sdd/ directory..." -ForegroundColor Cyan

# Create .sdd/README.md
$sddReadme = @'
# SDD Workspace

## 目录结构

```
.sdd/
├── README.md              # 本文件 - SDD 工作空间说明
├── ROADMAP.md             # 版本路线图
├── config.json            # SDD 配置（可选）
└── specs-tree-root/                # 规范文件目录
    ├── README.md          # 目录说明
    └── [feature]/         # Feature 目录
```

## 快速开始

1. 使用 `@sdd 开始 [feature 名称]` 开始新 feature
2. 规范文件将自动创建在 `.sdd/specs-tree-root/` 目录
3. 文档会自动维护，无需手动创建 README

## Agents

- `@sdd` - 智能入口
- `@sdd-docs` - 目录导航（自动触发）
- `@sdd-roadmap` - Roadmap 规划
'@
Set-Content -Path "$TargetDir\.sdd\README.md" -Value $sddReadme -Encoding UTF8
Write-Host "[OK] Created .sdd/README.md" -ForegroundColor Green

# Create .sdd/specs-tree-root/README.md
$specsReadme = @'
# SDD 规范目录

## 目录结构

```
.sdd/
├── README.md              # 本文件
├── [feature-1]/           # Feature 1
│   ├── spec.md
│   ├── plan.md
│   ├── tasks.md
│   └── state.json
└── [feature-2]/           # Feature 2
    └── ...
```

## 使用说明

- 每个 Feature 有独立的目录
- 文档会自动维护（@sdd-docs）
'@
Set-Content -Path "$TargetDir\.sdd\specs-tree-root\README.md" -Value $specsReadme -Encoding UTF8
Write-Host "[OK] Created .sdd/specs-tree-root/README.md" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Installed to: $TargetDir"
Write-Host ""
Write-Host "Files:"
Write-Host "  - .opencode/plugins/sdd/ ($fileCount files from dist/sdd/src/)"
Write-Host "  - .opencode/agents/ ($agentCount agents from dist/sdd/agents/ or alternative locations)"
Write-Host "  - opencode.json (plugin configuration)"
Write-Host "  - .sdd/ (SDD workspace container)"
Write-Host "    └── specs-tree-root/ (SDD specification files)"
Write-Host ""
Write-Host "Agents installed ($agentCount total):" -ForegroundColor Cyan
Write-Host "  @sdd              - Smart entry point"
Write-Host "  @sdd-help         - Help assistant"
Write-Host "  @sdd-discovery    - Requirement Discovery (Stage 0/6)"
Write-Host "  @sdd-0-discovery  - Requirement Discovery full name (Stage 0/6)"
Write-Host "  @sdd-1-spec       - Specification (Phase 1/6)"
Write-Host "  @sdd-2-plan       - Technical planning (Phase 2/6)"
Write-Host "  @sdd-3-tasks      - Task breakdown (Phase 3/6)"
Write-Host "  @sdd-4-build      - Implementation (Phase 4/6)"
Write-Host "  @sdd-5-review     - Code review (Phase 5/6)"
Write-Host "  @sdd-6-validate   - Validation (Phase 6/6)"
Write-Host "  (Short names also available: @sdd-spec, @sdd-plan, etc.)"
Write-Host ""
Write-Host "Quick Start:" -ForegroundColor Cyan
Write-Host "  cd '$TargetDir'"
Write-Host "  opencode"
Write-Host "  For discovery: @sdd-discovery [feature]"
Write-Host "  Overall workflow: @sdd 开始 [feature 名称]"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Gray
Write-Host "  - README.md     - Full documentation"
Write-Host "  - CHANGELOG.md  - Version history"
Write-Host ""
Write-Host "=== SDD Plugin Installer ===" -ForegroundColor Cyan
Write-Host "Source: $ScriptDir"
Write-Host "Target: $TargetDir"
Write-Host ""

# Step 1: Check source
Write-Host "[1/6] Checking source..." -ForegroundColor Cyan
if (-not (Test-Path "$ScriptDir\package.json")) {
    Write-Host "ERROR: package.json not found" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Source validated" -ForegroundColor Green

# Step 2: Build everything to dist/
Write-Host "[2/6] Building to dist/..." -ForegroundColor Cyan

# Build agents
Write-Host "  Building agents..." -ForegroundColor Gray
& node "$ScriptDir\build-agents.cjs"
if ($LASTEXITCODE -ne 0) { Write-Host "Agent build failed" -ForegroundColor Red; exit 1 }

# Build TypeScript
if (Test-Path "$ScriptDir\node_modules") {
    Write-Host "  Building TypeScript..." -ForegroundColor Gray
    & "$ScriptDir\node_modules\.bin\tsc.cmd" --project "$ScriptDir\tsconfig.json"
    if ($LASTEXITCODE -ne 0) { Write-Host "TS build failed" -ForegroundColor Red; exit 1 }
} else {
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    & npm install --prefix $ScriptDir
    if ($LASTEXITCODE -ne 0) { Write-Host "Install failed" -ForegroundColor Red; exit 1 }
    & "$ScriptDir\node_modules\.bin\tsc.cmd" --project "$ScriptDir\tsconfig.json"
    if ($LASTEXITCODE -ne 0) { Write-Host "TS build failed" -ForegroundColor Red; exit 1 }
}

Write-Host "[OK] Build complete" -ForegroundColor Green

# Step 3: Create directories
Write-Host "[3/6] Creating directories..." -ForegroundColor Cyan
$dirs = @(
    "$TargetDir\.opencode\plugins\sdd",
    "$TargetDir\.opencode\agents",
    "$TargetDir\.sdd",
    "$TargetDir\.sdd\specs-tree-root"
)
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "[WARN] Exists: $dir" -ForegroundColor Yellow
    } else {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "[OK] Created: $dir" -ForegroundColor Green
    }
}

# Step 4: Copy plugin from dist/ (exclude templates/)
Write-Host "[4/6] Copying plugin from dist/..." -ForegroundColor Cyan
$pluginDest = "$TargetDir\.opencode\plugins\sdd"
# Clean destination first
if (Test-Path $pluginDest) { Remove-Item $pluginDest -Recurse -Force }
New-Item -ItemType Directory -Force -Path $pluginDest | Out-Null
Get-ChildItem "$ScriptDir\dist" | Where-Object { $_.Name -ne "templates" } | Copy-Item -Destination $pluginDest -Recurse -Force

# Copy agents from dist/templates/agents/ to .opencode/agents/
Write-Host "  Copying agents..." -ForegroundColor Gray
Copy-Item "$ScriptDir\dist\templates\agents\*" -Destination "$TargetDir\.opencode\agents\" -Force
$agentCount = (Get-ChildItem "$TargetDir\.opencode\agents" | Measure-Object).Count

$fileCount = (Get-ChildItem "$TargetDir\.opencode\plugins\sdd" -Recurse | Measure-Object).Count
Write-Host "[OK] Copied $fileCount plugin files + $agentCount agents" -ForegroundColor Green

# Step 5: Copy opencode.json from dist/
Write-Host "[5/6] Copying opencode.json..." -ForegroundColor Cyan
Copy-Item "$ScriptDir\dist\opencode.json" -Destination "$TargetDir\opencode.json" -Force
Write-Host "[OK] Copied opencode.json" -ForegroundColor Green

# Step 6: Initialize .sdd/ directory structure
Write-Host "[6/6] Initializing .sdd/ directory..." -ForegroundColor Cyan

# Create .sdd/README.md
$sddReadme = @'
# SDD Workspace

## 目录结构

```
.sdd/
├── README.md              # 本文件 - SDD 工作空间说明
├── ROADMAP.md             # 版本路线图
├── config.json            # SDD 配置（可选）
└── specs-tree-root/                # 规范文件目录
    ├── README.md          # 目录说明
    └── [feature]/         # Feature 目录
```

## 快速开始

1. 使用 `@sdd 开始 [feature 名称]` 开始新 feature
2. 规范文件将自动创建在 `.sdd/specs-tree-root/` 目录
3. 文档会自动维护，无需手动创建 README

## Agents

- `@sdd` - 智能入口
- `@sdd-docs` - 目录导航（自动触发）
- `@sdd-roadmap` - Roadmap 规划
'@
Set-Content -Path "$TargetDir\.sdd\README.md" -Value $sddReadme -Encoding UTF8
Write-Host "[OK] Created .sdd/README.md" -ForegroundColor Green

# Create .sdd/specs-tree-root/README.md
$specsReadme = @'
# SDD 规范目录

## 目录结构

```
specs-tree-root/
├── README.md              # 本文件
├── [feature-1]/           # Feature 1
│   ├── spec.md
│   ├── plan.md
│   ├── tasks.md
│   └── state.json
└── [feature-2]/           # Feature 2
    └── ...
```

## 使用说明

- 每个 Feature 有独立的目录
- 文档会自动维护（@sdd-docs）
'@
Set-Content -Path "$TargetDir\.sdd\specs-tree-root\README.md" -Value $specsReadme -Encoding UTF8
Write-Host "[OK] Created .sdd/specs-tree-root/README.md" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Installed to: $TargetDir"
Write-Host ""
Write-Host "Files:"
Write-Host "  - .opencode/plugins/sdd/ ($fileCount files from dist/)"
Write-Host "  - .opencode/agents/ (16 agents from dist/templates/agents/)"
Write-Host "  - opencode.json (plugin configuration)"
Write-Host "  - .sdd/ (SDD workspace container)"
Write-Host "    └── specs-tree-root/ (SDD specification files)"
Write-Host ""
Write-Host "Agents installed (16 total):" -ForegroundColor Cyan
Write-Host "  @sdd              - Smart entry point"
Write-Host "  @sdd-help         - Help assistant"
Write-Host "  @sdd-1-spec       - Specification (Phase 1/6)"
Write-Host "  @sdd-2-plan       - Technical planning (Phase 2/6)"
Write-Host "  @sdd-3-tasks      - Task breakdown (Phase 3/6)"
Write-Host "  @sdd-4-build      - Implementation (Phase 4/6)"
Write-Host "  @sdd-5-review     - Code review (Phase 5/6)"
Write-Host "  @sdd-6-validate   - Validation (Phase 6/6)"
Write-Host "  (Short names also available: @sdd-spec, @sdd-plan, etc.)"
Write-Host ""
Write-Host "Quick Start:" -ForegroundColor Cyan
Write-Host "  cd '$TargetDir'"
Write-Host "  opencode"
Write-Host "  @sdd 开始 [feature 名称]"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Gray
Write-Host "  - README.md     - Full documentation"
Write-Host "  - CHANGELOG.md  - Version history"
Write-Host ""
