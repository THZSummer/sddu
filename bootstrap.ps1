<#
.SYNOPSIS
    SDDU Bootstrap — 一行命令安装 SDDU 到你的项目 (Windows)
.DESCRIPTION
    从 GitHub 拉取 SDDU 最新源码，构建并安装到目标项目。

    用法:
      powershell -ExecutionPolicy Bypass -Command "iwr -UseBasicParsing https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.ps1 | iex; Install-Sddu -TargetDir ./my-project"

    或者先下载再执行:
      Invoke-RestMethod https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.ps1 -OutFile bootstrap.ps1
      .\bootstrap.ps1 -TargetDir ./my-project
      .\bootstrap.ps1 -TargetDir ./my-project -ProxyUrl https://gh-proxy.com/

    需要: git, node, npm
#>

param(
    [Parameter(Position=0)]
    [string]$TargetDir = ".",
    [string]$ProxyUrl = ""
)

$ErrorActionPreference = "Stop"
$RepoBase = "https://github.com/THZSummer/sddu.git"

if ($ProxyUrl) {
    $RepoUrl = "$($ProxyUrl.TrimEnd('/'))/$RepoBase"
} else {
    $RepoUrl = $RepoBase
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       SDDU Bootstrap Installer          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "目标项目: $TargetDir"
if ($ProxyUrl) {
    Write-Host "网络模式: 镜像 ($ProxyUrl)"
} else {
    Write-Host "网络模式: 直连 GitHub"
}
Write-Host ""

# 检查依赖
$deps = @("git", "node", "npm")
foreach ($cmd in $deps) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "错误: 需要 $cmd，请先安装" -ForegroundColor Red
        exit 1
    }
}

# 创建临时目录
$TmpDir = Join-Path $env:TEMP "sddu-bootstrap-$(Get-Random)"
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

try {
    Write-Host "[1/2] 拉取 SDDU 最新代码..." -ForegroundColor Cyan
    git clone --depth 1 $RepoUrl $TmpDir 2>&1 | Select-Object -Last 1

    Write-Host ""
    Write-Host "[2/2] 构建并安装 SDDU 到目标项目..." -ForegroundColor Cyan
    & bash "$TmpDir/install.sh" $TargetDir

    Write-Host ""
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✅ SDDU 安装完成！                     ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "  目标项目: $TargetDir"
    Write-Host "  启动:     cd $TargetDir && opencode"
    Write-Host ""
}
finally {
    Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue
}

# 导出函数，支持 iex 调用
function Install-Sddu {
    param(
        [string]$TargetDir = ".",
        [string]$ProxyUrl = ""
    )
    & $PSCommandPath -TargetDir $TargetDir -ProxyUrl $ProxyUrl
}
