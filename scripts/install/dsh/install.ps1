<#
.SYNOPSIS
    SDDU 在 dsh 平台的 Skill 包安装脚本（PowerShell / Windows）
.DESCRIPTION
    从 dist/dsh/skills/ 拷贝全部 SDDU Skill 目录（1 个路由 sddu + 10 个 sddu-* = 11 个）
    到目标项目，支持自动构建、幂等覆盖、EC-002 冲突检测与启动引导。

    用法:
      # 项目级（默认，rank 100）
      powershell -ExecutionPolicy Bypass -File scripts/install/dsh/install.ps1 -ProjectRoot ./my-project

      # 用户级（rank 400）
      powershell -ExecutionPolicy Bypass -File scripts/install/dsh/install.ps1 -Scope user

      # 强制重建 + 升级
      powershell -ExecutionPolicy Bypass -File scripts/install/dsh/install.ps1 -ProjectRoot ./my-project -Build
      powershell -ExecutionPolicy Bypass -File scripts/install/dsh/install.ps1 -ProjectRoot ./my-project -Upgrade

    行为要点：
      - 主落位 rank 100 project-dsh → <projectRoot>/.dsh/skills（推荐，默认）
      - 可选落位 rank 400 user-dsh → <dshHome>/skills
      - 来源缺失或 -Build 时自动 npm run build:dsh
      - EC-002：检测到同名/近义条目时显式提示，不静默遮蔽
      - 幂等：重复执行为覆盖式安装并给出提示
#>

param(
    [string]$ProjectRoot = "",
    [string]$Scope = "project",
    [string]$DshHome = "",
    [string]$Source = "",
    [switch]$Build,
    [switch]$Upgrade,
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

# 仓库根（scripts/install/dsh/ 向上三级）
$RepoRoot = (Resolve-Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "../../..")).Path

# 落位与命名常量（与 install.sh / src/adapters/dsh/index.ts / docs/dsh/README.md 同源）
$ProjectRank = 100
$UserRank = 400
$ProjectSkillsRel = ".dsh/skills"
$UserSkillsSubdir = "skills"
$SkillPrefix = "sddu-"
$RouterSkill = "sddu"
$ExpectedSkillCount = 11
$VerificationDoc = "docs/dsh/verification.md"

if (-not $DshHome) { $DshHome = Join-Path $HOME ".dsh" }
if (-not $Source) { $Source = Join-Path $RepoRoot "dist/dsh/skills" }
if ($Upgrade) { $Build = $true }

# ---- 落位目标与 rank 解析 ---------------------------------------------------
$TargetRank = $ProjectRank
$TargetRankName = "project-dsh"
if ($Scope -eq "project") {
    if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path }
    $TargetDir = Join-Path $ProjectRoot $ProjectSkillsRel
} elseif ($Scope -eq "user") {
    $TargetDir = Join-Path $DshHome $UserSkillsSubdir
    $TargetRank = $UserRank
    $TargetRankName = "user-dsh"
} else {
    Write-Host "❌ 非法 -Scope 值: '$Scope'（允许: project | user）" -ForegroundColor Red
    exit 2
}

# ---- 来源校验 + 自动构建（FR-003 / ADR-002）--------------------------------
if ($Build -or -not (Test-Path $Source)) {
    Write-Host "🔨 构建 dsh Skill 包（npm run build:dsh）..." -ForegroundColor Cyan
    Push-Location $RepoRoot
    try {
        & npm run build:dsh
        if ($LASTEXITCODE -ne 0) { throw "npm run build:dsh 退出码 $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path $Source)) {
    Write-Host "❌ 未找到 Skill 包来源目录: $Source" -ForegroundColor Red
    Write-Host "   请先运行 'npm run build'（含 build:dsh）生成 dist/dsh/skills/。" -ForegroundColor Red
    exit 1
}

# 收集 SDDU 拥有的 Skill 目录：精确名 "sddu"（路由）+ 前缀 "sddu-*"（其余 10 个）
$SkillDirs = @(Get-ChildItem $Source -Directory | Where-Object { $_.Name -eq $RouterSkill -or $_.Name.StartsWith($SkillPrefix) } | ForEach-Object { $_.Name })

if ($SkillDirs.Count -ne $ExpectedSkillCount) {
    Write-Host "❌ Skill 目录数量不符：期望 $ExpectedSkillCount 个，实际 $($SkillDirs.Count) 个" -ForegroundColor Red
    Write-Host "   实际收集到: $($SkillDirs -join ' ')" -ForegroundColor Red
    Write-Host "   请先运行 'npm run build'（含 build:dsh）后重试。" -ForegroundColor Red
    exit 1
}

foreach ($name in $SkillDirs) {
    $skillMd = Join-Path $Source "$name/SKILL.md"
    if (-not (Test-Path $skillMd) -or (Get-Item $skillMd).Length -eq 0) {
        Write-Host "❌ 来源目录缺少非空 SKILL.md: $skillMd" -ForegroundColor Red
        exit 1
    }
}

# ---- EC-002：同名 / 近义冲突检测（显式提示，不静默）--------------------------
$Conflicts = @()
if (Test-Path $TargetDir) {
    foreach ($existing in Get-ChildItem $TargetDir -Directory) {
        $ebase = $existing.Name
        if ($ebase -like "*sddu*" -and $ebase -ne $RouterSkill) {
            if ($SkillDirs -notcontains $ebase) {
                $Conflicts += $ebase
            }
        }
    }
}

# ---- 安装（幂等覆盖）--------------------------------------------------------
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

Write-Host ""
Write-Host "📦 SDDU Skill 包安装（dsh平台）" -ForegroundColor Cyan
Write-Host "---------------------------------------------"
Write-Host "  来源目录   : $Source"
Write-Host "  落位目标   : $TargetDir"
Write-Host "  命中 rank  : rank $TargetRank ($TargetRankName)"
Write-Host "  作用域     : $Scope"
Write-Host "  安装条目数 : $($SkillDirs.Count)"
Write-Host "---------------------------------------------"

foreach ($name in $SkillDirs) {
    $dest = Join-Path $TargetDir $name
    if (Test-Path $dest) {
        Write-Host "  ♻️  幂等覆盖: $name（目标已存在，按最新构建产物覆盖）" -ForegroundColor Yellow
        Remove-Item -Path $dest -Recurse -Force
    } else {
        Write-Host "  ✅ 安装: $name" -ForegroundColor Green
    }
    Copy-Item -Path (Join-Path $Source $name) -Destination $dest -Recurse
}

# ---- 落位自检清单 -----------------------------------------------------------
Write-Host ""
Write-Host "🔍 落位自检清单" -ForegroundColor Cyan
Write-Host "---------------------------------------------"
Write-Host "  目标绝对路径 : $(Resolve-Path $TargetDir)"
Write-Host "  命中 rank    : rank $TargetRank ($TargetRankName)"
Write-Host "  本次落位条目 : $($SkillDirs.Count)"
Write-Host "  已落位条目   :"
foreach ($name in $SkillDirs) {
    $skillMd = Join-Path $TargetDir "$name/SKILL.md"
    if (Test-Path $skillMd -and (Get-Item $skillMd).Length -gt 0) {
        Write-Host "    - $name/SKILL.md"
    } else {
        Write-Host "    - $name/SKILL.md  ⚠️ 缺失或为空" -ForegroundColor Yellow
    }
}
Write-Host "---------------------------------------------"

# ---- EC-002：冲突提示 -------------------------------------------------------
Write-Host ""
Write-Host "⚠️  EC-002 冲突检测（同名 / 近义条目）" -ForegroundColor Yellow
if ($Conflicts.Count -gt 0) {
    Write-Host "  ⚠️ 检测到同层近义条目（不会被本脚本接管，也不会被删除）：" -ForegroundColor Yellow
    foreach ($item in $Conflicts) {
        Write-Host "    - $(Join-Path $TargetDir $item) → 与本包命名近义，请人工确认是否遮蔽预期"
    }
} else {
    Write-Host "  ✅ 同层未检测到同名 / 近义条目。"
}

# ---- EC-004：发现缓存重新快照提示 -------------------------------------------
Write-Host ""
Write-Host "🔄 EC-004 发现缓存失效提示" -ForegroundColor Yellow
Write-Host "  ⚠️ 宿主 skill 发现缓存以解析后的 scope 链为键；本次安装改变了 skills 目录内容，"
Write-Host "     请确认宿主触发了 skills/change 事件并重新快照发现缓存。"
Write-Host "     若 skill 列表未刷新，请重新加载或重启会话后再观测。"

# ---- 启动引导（FR-004）------------------------------------------------------
Write-Host ""
Write-Host "🚀 启动引导" -ForegroundColor Cyan
Write-Host "  1) 进入目标项目并启动 dsh Web UI:"
Write-Host "       cd $ProjectRoot && npx @deepseek-ai/dsh web"
Write-Host "  2) 若 skill 列表未刷新（EC-004），请重新加载或重启会话。"
Write-Host "  3) 入口：在会话中输入 /sddu（仪表盘）或 /sddu discovery <feature>。"

if ($Upgrade) {
    Write-Host ""
    Write-Host "🔄 升级模式提示" -ForegroundColor Yellow
    Write-Host "  已按最新产物幂等覆盖。升级跟随请按 docs/dsh/upgrade-following.md 步骤 0~6 执行，"
    Write-Host "  并重复 V1~V3 场景 + 填写破坏点记录模板（dsh 无 CLI，无法自动断言）。"
}

Write-Host ""
Write-Host "✅ 安装完成。" -ForegroundColor Green
