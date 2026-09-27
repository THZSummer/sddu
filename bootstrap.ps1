<#
.SYNOPSIS
    SDDU Bootstrap — 一行命令安装 SDDU 到你的项目 (Windows)
.DESCRIPTION
    从 GitHub 拉取 SDDU 最新源码，构建并安装到目标项目。

    用法:
      # 直连（默认 opencode 适配）
      powershell -ExecutionPolicy Bypass -Command "iwr -UseBasicParsing https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.ps1 | iex; Install-Sddu -TargetDir ./my-project"
      # 镜像
      powershell -ExecutionPolicy Bypass -Command "iwr -UseBasicParsing https://gh-proxy.org/https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.ps1 | iex; Install-Sddu -TargetDir ./my-project -ProxyUrl https://gh-proxy.org/"
      # dsh 适配
      powershell -ExecutionPolicy Bypass -Command "iwr -UseBasicParsing https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.ps1 | iex; Install-Sddu -TargetDir ./my-project -Platform dsh"

    或者先下载再执行:
      Invoke-RestMethod https://raw.githubusercontent.com/THZSummer/sddu/main/bootstrap.ps1 -OutFile bootstrap.ps1
      .\bootstrap.ps1 -TargetDir ./my-project
      .\bootstrap.ps1 -TargetDir ./my-project -Platform dsh
      .\bootstrap.ps1 -TargetDir ./my-project -ProxyUrl https://gh-proxy.org/

    需要: git, node, npm
#>

param(
    [Parameter(Position=0)]
    [string]$TargetDir = ".",
    [string]$ProxyUrl = "",
    [string]$Platform = "opencode"
)

function Install-Sddu {
    param(
        [string]$TargetDir = ".",
        [string]$ProxyUrl = "",
        [string]$Platform = "opencode"
    )

    $ErrorActionPreference = "Stop"
    # 允许本进程执行子 .ps1 脚本（进程级，不持久化，无需管理员权限）
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
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
    Write-Host "适配平台: $Platform"
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
        git clone --depth 1 $RepoUrl $TmpDir
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "❌ 克隆失败" -ForegroundColor Red
            Write-Host "提示: 如网络受限，请使用 -ProxyUrl 参数指定镜像" -ForegroundColor Yellow
            Write-Host "  例: Install-Sddu -TargetDir ./my-project -ProxyUrl https://gh-proxy.org/" -ForegroundColor Yellow
            exit 1
        }

        Write-Host ""
        Write-Host "[2/2] 构建并安装 SDDU 到目标项目..." -ForegroundColor Cyan
        switch ($Platform) {
            "opencode" {
                & "$TmpDir/scripts/install/opencode/install.ps1" -TargetDir $TargetDir
            }
            "dsh" {
                & "$TmpDir/scripts/install/dsh/install.ps1" -ProjectRoot $TargetDir -Build -Yes
            }
            default {
                Write-Host "❌ 非法 -Platform 值: '$Platform'（允许: opencode | dsh）" -ForegroundColor Red
                exit 1
            }
        }

        Write-Host ""
        Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║   ✅ SDDU 安装完成！                     ║" -ForegroundColor Green
        Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        Write-Host "  目标项目: $TargetDir"
        if ($Platform -eq "dsh") {
            Write-Host "  落位:     $TargetDir/.dsh/skills/（11 个 sddu* skill）"
            Write-Host "  启动:     cd $TargetDir && npx @deepseek-ai/dsh web"
            Write-Host "  入口:     /sddu（仪表盘）或 /sddu discovery <feature>"
        } else {
            Write-Host "  启动:     cd $TargetDir && opencode"
        }
        Write-Host ""
    }
    finally {
        Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 直接执行脚本（非 iex）时自动调用；iex 加载后由用户手动调 Install-Sddu
if ($PSCommandPath) {
    Install-Sddu -TargetDir $TargetDir -ProxyUrl $ProxyUrl -Platform $Platform
}
