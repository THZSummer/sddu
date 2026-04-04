#!/usr/bin/env bash
# SDD Plugin Installer (Linux/macOS)
# Usage: bash install.sh <TargetDir>
#    or: ./install.sh <TargetDir>
# Note: Must use bash, not sh!

# Detect if running with sh instead of bash
if [ -z "$BASH_VERSION" ]; then
    echo "ERROR: This script requires bash."
    echo ""
    echo "You ran it with 'sh', but it must be run with 'bash':"
    echo ""
    echo "  bash install.sh <TargetDir>"
    echo "  # or"
    echo "  ./install.sh <TargetDir>"
    echo ""
    exit 1
fi

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m'

# Helper function for colored output
print_color() {
    printf "%b\n" "$1"
}

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
if [ -z "$1" ]; then
    print_color "${RED}ERROR: Target directory required${NC}"
    echo ""
    echo "Usage: bash install.sh <TargetDir>"
    echo "   or: ./install.sh <TargetDir>"
    echo ""
    echo "Note: This script requires bash. Do NOT run with 'sh install.sh'"
    echo ""
    exit 1
fi

TARGET_DIR="$1"

echo ""
print_color "${CYAN}=== SDD Plugin Installer ===${NC}"
print_color "Source: ${SCRIPT_DIR}"
print_color "Target: ${TARGET_DIR}"
echo ""

# Step 1: Check source
print_color "${CYAN}[1/7] Checking source...${NC}"
if [ ! -f "${SCRIPT_DIR}/package.json" ]; then
    print_color "${RED}ERROR: package.json not found${NC}"
    exit 1
fi
print_color "${GREEN}[OK] Source validated${NC}"

# Step 2: Build everything to dist/
print_color "${CYAN}[2/7] Building to dist/...${NC}"

# Build agents
print_color "${GRAY}  Building agents...${NC}"
node "${SCRIPT_DIR}/build-agents.cjs"
if [ $? -ne 0 ]; then
    print_color "${RED}Agent build failed${NC}"
    exit 1
fi

# Build TypeScript
if [ -d "${SCRIPT_DIR}/node_modules" ]; then
    print_color "${GRAY}  Building TypeScript...${NC}"
    "${SCRIPT_DIR}/node_modules/.bin/tsc" --project "${SCRIPT_DIR}/tsconfig.json"
    if [ $? -ne 0 ]; then
        print_color "${RED}TS build failed${NC}"
        exit 1
    fi
else
    print_color "${GRAY}  Installing dependencies...${NC}"
    npm install --prefix "${SCRIPT_DIR}"
    if [ $? -ne 0 ]; then
        print_color "${RED}Install failed${NC}"
        exit 1
    fi
    "${SCRIPT_DIR}/node_modules/.bin/tsc" --project "${SCRIPT_DIR}/tsconfig.json"
    if [ $? -ne 0 ]; then
        print_color "${RED}TS build failed${NC}"
        exit 1
    fi
fi

print_color "${GREEN}[OK] Build complete${NC}"

# Step 3: Create directories
print_color "${CYAN}[3/7] Creating directories...${NC}"

# Create directories one by one (POSIX compatible, no arrays)
for dir in "${TARGET_DIR}/.opencode/plugins/sdd" "${TARGET_DIR}/.opencode/agents" "${TARGET_DIR}/.sdd" "${TARGET_DIR}/.sdd/.specs"; do
    if [ -d "$dir" ]; then
        print_color "${YELLOW}[WARN] Exists: $dir${NC}"
    else
        mkdir -p "$dir"
        print_color "${GREEN}[OK] Created: $dir${NC}"
    fi
done

# Step 4: Copy plugin from dist/ (exclude templates/)
print_color "${CYAN}[4/7] Copying plugin from dist/...${NC}"
PLUGIN_DEST="${TARGET_DIR}/.opencode/plugins/sdd"

# Clean destination first
if [ -d "$PLUGIN_DEST" ]; then
    rm -rf "$PLUGIN_DEST"
fi
mkdir -p "$PLUGIN_DEST"

# Copy from dist/ excluding templates/
for item in "${SCRIPT_DIR}/dist"/*; do
    item_name=$(basename "$item")
    if [ "$item_name" != "templates" ]; then
        cp -r "$item" "$PLUGIN_DEST/"
    fi
done

# Copy agents from dist/templates/agents/ to .opencode/agents/
print_color "${GRAY}  Copying agents...${NC}"
cp "${SCRIPT_DIR}/dist/templates/agents/"* "${TARGET_DIR}/.opencode/agents/"
AGENT_COUNT=$(find "${TARGET_DIR}/.opencode/agents" -type f | wc -l)

FILE_COUNT=$(find "${TARGET_DIR}/.opencode/plugins/sdd" -type f | wc -l)
print_color "${GREEN}[OK] Copied $FILE_COUNT plugin files + $AGENT_COUNT agents (including discovery agent)${NC}"

# Step 5: Version Detection
print_color "${CYAN}[5/7] Version Detection...${NC}"

# Get source version
SOURCE_PKG_PATH="${SCRIPT_DIR}/package.json"
if [ -f "$SOURCE_PKG_PATH" ]; then
    SOURCE_VERSION=$(node -p "require('$SOURCE_PKG_PATH').version" 2>/dev/null || echo "")
    if [ -z "$SOURCE_VERSION" ]; then
        SOURCE_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$SOURCE_PKG_PATH" | cut -d'"' -f4)
    fi
fi

# Get target version if it exists
TARGET_VERSION=""
PLUGINS_DIR="${TARGET_DIR}/.opencode/plugins/sdd"
if [ -f "$PLUGINS_DIR/package.json" ]; then
    TARGET_VERSION=$(node -p "require('$PLUGINS_DIR/package.json').version" 2>/dev/null || echo "")
    if [ -z "$TARGET_VERSION" ]; then
        TARGET_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$PLUGINS_DIR/package.json" | cut -d'"' -f4)
    fi
fi

if [ -n "$SOURCE_VERSION" ] && [ -n "$TARGET_VERSION" ]; then
    print_color "${CYAN}[Version Check]${NC}"
    print_color "  Installed: v$TARGET_VERSION"
    print_color "  New:       v$SOURCE_VERSION"
    
    # Compare versions to determine update type
    IFS='.' read -ra SRC_VER_ARR <<< "$SOURCE_VERSION"
    IFS='.' read -ra TGT_VER_ARR <<< "$TARGET_VERSION"
    
    IS_UPDATE=0
    UPDATE_TYPE="Unknown"
    
    if [[ ${SRC_VER_ARR[0]} -gt ${TGT_VER_ARR[0]} ]]; then
        # Major version upgrade
        UPDATE_TYPE="Major update: Please check changelog"
        IS_UPDATE=1
    elif [[ ${SRC_VER_ARR[0]} -lt ${TGT_VER_ARR[0]} ]]; then
        # Major version downgrade
        UPDATE_TYPE="Major downgrade: This is not recommended"
        IS_UPDATE=-1
    elif [[ ${SRC_VER_ARR[1]} -gt ${TGT_VER_ARR[1]} ]]; then
        # Minor version upgrade
        UPDATE_TYPE="Minor update (feature release)"
        IS_UPDATE=1
    elif [[ ${SRC_VER_ARR[1]} -lt ${TGT_VER_ARR[1]} ]]; then
        # Minor version downgrade
        UPDATE_TYPE="Minor downgrade: This is not recommended"
        IS_UPDATE=-1
    elif [[ ${SRC_VER_ARR[2]} -gt ${TGT_VER_ARR[2]} ]]; then
        # Patch version upgrade
        UPDATE_TYPE="Patch update (bug fixes)"
        IS_UPDATE=1
    elif [[ ${SRC_VER_ARR[2]} -lt ${TGT_VER_ARR[2]} ]]; then
        # Patch version downgrade
        UPDATE_TYPE="Patch downgrade: This is not recommended"
        IS_UPDATE=-1
    else
        # Same version
        UPDATE_TYPE="No changes (same version)"
        IS_UPDATE=0
    fi
    
    print_color "  Type:      $UPDATE_TYPE${NC}"
    
    if [ $IS_UPDATE -eq 0 ]; then
        print_color "  Status:    ${GREEN}Already up-to-date${NC}"
    elif [ $IS_UPDATE -eq 1 ]; then
        print_color "  Status:    ${CYAN}Update available${NC}"
        read -p "  Proceed with update? [Y/n]: " confirm
        if [ -z "$confirm" ] || [ "$confirm" = "Y" ] || [ "$confirm" = "y" ]; then
            echo "  Continuing..."
        else
            echo "Installation cancelled by user"
            exit 0
        fi
    else
        print_color "  Status:    ${RED}Downgrade detected (not recommended)${NC}"
        read -p "  Continue anyway? [Y/n]: " confirm
        if [ "$confirm" = "Y" ] || [ "$confirm" = "y" ]; then
            echo "  Downgrading, but this is not recommended..."
        else
            echo "Installation cancelled by user"
            exit 0
        fi
    fi
elif [ -n "$SOURCE_VERSION" ]; then
    print_color "${GREEN}New installation (v$SOURCE_VERSION)${NC}"
else
    print_color "${YELLOW}Version detection failed${NC}"
fi

echo ""

# Step 6: Merge opencode.json (smart merge)
print_color "${CYAN}[6/7] Merging opencode.json...${NC}"

OPENCODE_JSON_PATH="${TARGET_DIR}/opencode.json"
OPENCODE_SOURCE_PATH="${SCRIPT_DIR}/dist/opencode.json"

if [ -f "$OPENCODE_JSON_PATH" ]; then
    print_color "${CYAN}[CONFIG MERGE]${NC}"
    print_color "${GREEN}✅ Existing opencode.json found${NC}"
    
    # Perform smart merge using Node.js
    if node -e "
const fs = require('fs');
try {
    // Read existing and new config
    const existingConfig = JSON.parse(fs.readFileSync('${OPENCODE_JSON_PATH}', 'utf-8'));
    const newConfig = JSON.parse(fs.readFileSync('${OPENCODE_SOURCE_PATH}', 'utf-8'));
    
    // Create backup
    fs.writeFileSync('${OPENCODE_JSON_PATH}.backup', JSON.stringify(existingConfig, null, 2));
    
    // Merge plugin list (deduplicate)
    const existingPlugin = Array.isArray(existingConfig.plugin) ? existingConfig.plugin : [];
    const newPlugin = Array.isArray(newConfig.plugin) ? newConfig.plugin : [];
    existingConfig.plugin = [...new Set([...existingPlugin, ...newPlugin])];
    
    // Preserve existing agents and merge new ones
    existingConfig.agent = { ...(existingConfig.agent || {}), ...(newConfig.agent || {}) };
    
    // Preserve existing permissions if exist, otherwise uses new ones
    existingConfig.permission = (existingConfig.permission !== undefined) ? existingConfig.permission : newConfig.permission;
    
    // Always maintain schema if specified in new config
    if (newConfig.\$schema) {
        existingConfig.\$schema = newConfig.\$schema;
    }
    
    // Write merged config
    fs.writeFileSync('${OPENCODE_JSON_PATH}', JSON.stringify(existingConfig, null, 2));
    
    // Count changes
    console.log('PLUGINS_ADDED:' + newPlugin.length);
    console.log('AGENTS_UPDATED:' + Object.keys(newConfig.agent || {}).length);
    console.log('CUSTOM_AGENTS_PRESERVED:' + (Object.keys(existingConfig.agent || {}).length - Object.keys(newConfig.agent || {}).length));
    console.log('PERMISSIONS_MERGED:');
    
} catch (error) {
    console.error('MERGE_ERROR:', error.message);
    process.exit(1);
}
" > /tmp/sdd_merge_result.txt 2>/dev/null; then
    
        # Extract results from the output
        PLUGINS_ADDED=$(grep "PLUGINS_ADDED:" /tmp/sdd_merge_result.txt | cut -d':' -f2)
        AGENTS_UPDATED=$(grep "AGENTS_UPDATED:" /tmp/sdd_merge_result.txt | cut -d':' -f2)
        CUSTOM_AGENTS_PRESERVED=$(grep "CUSTOM_AGENTS_PRESERVED:" /tmp/sdd_merge_result.txt | cut -d':' -f2 | awk '{if($1 < 0) print 0; else print $1}')
        
        print_color "${GREEN}✅ Merging plugins:${NC} [opencode-sdd-plugin] (added $PLUGINS_ADDED new plugins)"
        print_color "${GREEN}✅ Merging agents: ${AGENTS_UPDATED}+ SDD agents updated, $CUSTOM_AGENTS_PRESERVED custom agents preserved${NC}"
        print_color "${GREEN}✅ Permissions preserved${NC}"
    
    else
        # If merge fails, backup original and copy new version
        print_color "${YELLOW}[WARN] Config merge failed, copying new config and backing up original${NC}"
        cp "${OPENCODE_JSON_PATH}" "${OPENCODE_JSON_PATH}.failed_backup"
        cp "${OPENCODE_SOURCE_PATH}" "${OPENCODE_JSON_PATH}"
        print_color "${GREEN}[OK] Copied new opencode.json (original backed up as .failed_backup)${NC}"
    fi

else
    # No existing file - just copy
    print_color "${CYAN}ℹ️  No existing opencode.json, copying new config${NC}"
    cp "${OPENCODE_SOURCE_PATH}" "${OPENCODE_JSON_PATH}"
    print_color "${GREEN}[OK] Copied opencode.json${NC}"
fi

# Step 7: Initialize .sdd/ directory structure
print_color "${CYAN}[7/7] Initializing .sdd/ directory...${NC}"

# Create .sdd/README.md
cat > "${TARGET_DIR}/.sdd/README.md" << 'EOF'
# SDD Workspace

## 目录结构

```
.sdd/
├── README.md              # 本文件 - SDD 工作空间说明
├── ROADMAP.md             # 版本路线图
├── config.json            # SDD 配置（可选）
└── .specs/                # 规范文件目录
    ├── README.md          # 目录说明
    └── [feature]/         # Feature 目录
```

## 快速开始

1. 使用 `@sdd 开始 [feature 名称]` 开始新 feature
2. 规范文件将自动创建在 `.sdd/.specs/` 目录
3. 文档会自动维护，无需手动创建 README

## Agents

- `@sdd` - 智能入口
- `@sdd-docs` - 目录导航（自动触发）
- `@sdd-roadmap` - Roadmap 规划
EOF

print_color "${GREEN}[OK] Created .sdd/README.md${NC}"

# Create .sdd/.specs/README.md
cat > "${TARGET_DIR}/.sdd/.specs/README.md" << 'EOF'
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
EOF

print_color "${GREEN}[OK] Created .sdd/.specs/README.md${NC}"

# Done
echo ""
print_color "${GREEN}=== Installation Complete ===${NC}"
echo ""
print_color "Installed to: ${TARGET_DIR}"
echo ""
echo "Files:"
echo "  - .opencode/plugins/sdd/ ($FILE_COUNT files from dist/)"
echo "  - .opencode/agents/ ($AGENT_COUNT agents from dist/templates/agents/)"
echo "  - opencode.json (plugin configuration)"
echo "  - .sdd/ (SDD workspace container)"
echo ""
echo "  New Feature: Stage 0 (Discovery phase) is now available!"
echo "    - @sdd-discovery - Deep requirement analysis (Stage 0/6)"
echo "    - @sdd-0-discovery - Full name version"
echo ""
print_color "${CYAN}Agents installed ($AGENT_COUNT total):${NC}"
echo "  @sdd              - Smart entry point"
echo "  @sdd-help         - Help assistant"
echo "  @sdd-discovery    - Requirement Discovery (Stage 0/6)"
echo "  @sdd-0-discovery  - Requirement Discovery full name (Stage 0/6)"
echo "  @sdd-1-spec       - Specification (Phase 1/6)"
echo "  @sdd-2-plan       - Technical planning (Phase 2/6)"
echo "  @sdd-3-tasks      - Task breakdown (Phase 3/6)"
echo "  @sdd-4-build      - Implementation (Phase 4/6)"
echo "  @sdd-5-review     - Code review (Phase 5/6)"
echo "  @sdd-6-validate   - Validation (Phase 6/6)"
echo "  (Short names also available: @sdd-spec, @sdd-plan, etc.)"
echo ""
print_color "${CYAN}Quick Start:${NC}"
echo "  cd '${TARGET_DIR}'"
echo "  opencode"
echo "  For discovery: @sdd-discovery [feature]" 
echo "  Overall workflow: @sdd 开始 [feature 名称]"
echo ""
print_color "${GRAY}Documentation:${NC}"
echo "  - README.md     - Full documentation"
echo "  - CHANGELOG.md  - Version history"
echo ""