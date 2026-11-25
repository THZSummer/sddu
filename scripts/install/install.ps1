# SDDU 安装器 — 纯复制粘贴器（Windows / PowerShell 等价实现）
# 用法: .\install.ps1 <目标项目目录>
param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Target
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$Template = Join-Path $RepoRoot "sddu-project-template"

New-Item -ItemType Directory -Force -Path $Target | Out-Null

# 旧布局迁移：目标已存在 .sddu 但非「.sddu/.sddu + workspace 二分」布局
$sdduDir = Join-Path $Target ".sddu"
$essenceDir = Join-Path $sdduDir ".sddu"
if ((Test-Path $sdduDir) -and -not (Test-Path $essenceDir)) {
    $stamp = Get-Date -Format "yyyyMMddHHmmss"
    $backup = Join-Path $Target ".sddu-migration-backup-$stamp"
    Write-Host "[迁移] 检测到旧布局，整体备份到 $backup"
    Copy-Item -Recurse $sdduDir $backup -ErrorAction Stop
    $workspaceDir = Join-Path $sdduDir "workspace"
    New-Item -ItemType Directory -Force -Path $workspaceDir | Out-Null
    Copy-Item -Recurse -Force (Join-Path $backup "*") $workspaceDir
    foreach ($name in @("specs-tree-root","docs","docs-tree-root","skills","ROADMAP.md","TREE.md")) {
        $p = Join-Path $sdduDir $name
        if (Test-Path $p) { Remove-Item -Recurse -Force $p }
    }
}

# 纯复制：源路径 = 安装后路径，逐项一致
Copy-Item -Recurse -Force (Join-Path $Template "*") $Target

Write-Host "[完成] SDDU 已安装到 $Target"
Write-Host "  本体:  $(Join-Path $Target '.sddu\.sddu\')"
Write-Host "  工作空间: $(Join-Path $Target '.sddu\workspace\')"
Write-Host "  入口索引: $(Join-Path $Target '.agents\skills\sddu\SKILL.md')"
