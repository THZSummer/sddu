<#
.SYNOPSIS
    SDDU Bootstrap (dsh) — 一行命令安装 SDDU dsh Skill 包到你的项目 (Windows)
.DESCRIPTION
    从 GitHub 拉取 SDDU 最新源码，构建并安装 dsh Skill 包到目标项目。

    用法:
      # 直连
      powershell -ExecutionPolicy Bypass -Command "iwr -UseBasicParsing https://raw.githubusercontent.com/THZSummer/sddu/main/scripts/bootstrap-dsh.ps1 | iex; Install-Sddu-Dsh -TargetDir ./my-project"
      # 镜像
      powershell -ExecutionPolicy Bypass -Command "iwr -UseBasicParsing https://gh-proxy.com/https://raw.githubusercontent.com/THZSummer/sddu/main/scripts/bootstrap-dsh.ps1 | iex; Install-Sddu-Dsh -TargetDir ./my-project -ProxyUrl https://gh-proxy.com/"

    或者先下载再执行:
      Invoke-RestMethod https://raw.githubusercontent.com/THZSummer/sddu/main/scripts/bootstrap-dsh.ps1 -OutFile bootstrap-dsh.ps1
      .\bootstrap-dsh.ps1 -TargetDir ./my-project
      .\bootstrap-dsh.ps1 -TargetDir ./my-project -ProxyUrl https://gh-proxy.com/

    需要: git, node, npm, bash（通过 Git Bash 调用 install-dsh.sh）
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
Write-Host "║       SDDU Bootstrap Installer (dsh)    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "目标项目: $TargetDir"
if ($ProxyUrl) {
    Write-Host "网络模式: 镜像 ($ProxyUrl)"
} else {
    Write-Host "网络模式: 直连 GitHub"
}
Write-Host ""

# 检查依赖（EC-002 语义：依赖缺失明确报错 + 非零退出）
$deps = @("git", "node", "npm", "bash")
foreach ($cmd in $deps) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "错误: 需要 $cmd，请先安装" -ForegroundColor Red
        exit 1
    }
}

# 创建临时目录
$TmpDir = Join-Path $env:TEMP "sddu-bootstrap-dsh-$(Get-Random)"
New-Item -ItemType Directory -Force -Path $TmpDir | Out-Null

try {
    Write-Host "[1/2] 拉取 SDDU 最新代码..." -ForegroundColor Cyan
    git clone --depth 1 $RepoUrl $TmpDir 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ 克隆失败" -ForegroundColor Red
        Write-Host "提示: 如网络受限，请使用 -ProxyUrl 参数指定镜像" -ForegroundColor Yellow
        Write-Host "  例: .\bootstrap-dsh.ps1 ./my-project -ProxyUrl https://gh-proxy.com/" -ForegroundColor Yellow
        exit 1
    }

    Write-Host ""
    Write-Host "[2/2] 构建并安装 dsh Skill 包到目标项目..." -ForegroundColor Cyan
    & bash "$TmpDir/scripts/install-dsh.sh" --project-root $TargetDir --build --yes

    Write-Host ""
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✅ SDDU (dsh) 安装完成！               ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "  目标项目: $TargetDir"
    Write-Host "  落位:     $TargetDir/.dsh/skills/（11 个 sddu* skill）"
    Write-Host "  启动:     cd $TargetDir && npx @deepseek-ai/dsh web"
    Write-Host "  入口:     /sddu（仪表盘）或 /sddu discovery <feature>"
    Write-Host ""
}
finally {
    Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue
}

# 导出函数，支持 iex 调用
function Install-Sddu-Dsh {
    param(
        [string]$TargetDir = ".",
        [string]$ProxyUrl = ""
    )
    & $PSCommandPath -TargetDir $TargetDir -ProxyUrl $ProxyUrl
}
