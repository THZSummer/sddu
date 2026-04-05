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

# Step 2: Check for prebuilt dist/sdd directory
print_color "${CYAN}[2/7] Locating distribution files...${NC}"

DIST_SDD_DIR="${SCRIPT_DIR}/dist/sdd"
DIST_ARCHIVE="${SCRIPT_DIR}/dist/sdd.zip"

if [ -d "$DIST_SDD_DIR" ]; then
    print_color "${GREEN}[OK] Using pre-built distribution in dist/sdd/${NC}"
else
    print_color "${YELLOW}[INFO] Pre-built distribution not found, checking for archive...${NC}"
    if [ -f "$DIST_ARCHIVE" ]; then
        print_color "${GREEN}[INFO] Archive found at $DIST_ARCHIVE, unpacking...${NC}"
        mkdir -p "${SCRIPT_DIR}/dist/sdd"
        unzip -q "${DIST_ARCHIVE}" -d "${SCRIPT_DIR}/dist/tmp_extract"
        mv "${SCRIPT_DIR}/dist/tmp_extract/sdd" "${SCRIPT_DIR}/dist/sdd"
        rm -r "${SCRIPT_DIR}/dist/tmp_extract"
        print_color "${GREEN}[OK] Archive extracted to dist/sdd/${NC}"
    else
        print_color "${YELLOW}[WARN] No pre-built dist/sdd/ or dist/sdd.zip found${NC}"
        print_color "${CYAN}Building from source...${NC}"
        
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

        # Now run the packaging script to create dist/sdd/
        print_color "${GRAY}  Creating distribution package...${NC}"
        node "${SCRIPT_DIR}/scripts/package.cjs"
        if [ $? -ne 0 ]; then
            print_color "${RED}Package creation failed${NC}"
            exit 1
        fi
        
        print_color "${GREEN}[OK] Build complete, distribution package created${NC}"
    fi
fi

# Step 3: Create directories
print_color "${CYAN}[3/7] Creating directories...${NC}"

# Create directories one by one (POSIX compatible, no arrays)
for dir in "${TARGET_DIR}/.opencode/plugins/sdd" "${TARGET_DIR}/.opencode/agents" "${TARGET_DIR}/.sdd" "${TARGET_DIR}/.sdd/specs-tree-root"; do
    if [ -d "$dir" ]; then
        print_color "${YELLOW}[WARN] Exists: $dir${NC}"
    else
        mkdir -p "$dir"
        print_color "${GREEN}[OK] Created: $dir${NC}"
    fi
done

# Step 4: Copy plugin from dist/sdd/ (exclude templates/)
print_color "${CYAN}[4/7] Copying plugin from dist/sdd/...${NC}"
PLUGIN_DEST="${TARGET_DIR}/.opencode/plugins/sdd"

# Clean destination first
if [ -d "$PLUGIN_DEST" ]; then
    rm -rf "$PLUGIN_DEST"
fi
mkdir -p "$PLUGIN_DEST"

# Copy the entire dist/sdd/ directory contents except agents (to avoid duplication with separate agents copy)
for item in "${SCRIPT_DIR}/dist/sdd/"*; do
    item_name=$(basename "$item")
    if [ "$item_name" != "agents" ]; then
        cp -r "$item" "$PLUGIN_DEST/"
    fi
done

# Copy agents from dist/sdd/agents/ to .opencode/agents/
if [ -d "${SCRIPT_DIR}/dist/sdd/agents" ]; then
    print_color "${GRAY}  Copying agents...${NC}"
    cp "${SCRIPT_DIR}/dist/sdd/agents/"* "${TARGET_DIR}/.opencode/agents/"
    AGENT_COUNT=$(find "${TARGET_DIR}/.opencode/agents" -type f | wc -l)
else
    print_color "${YELLOW}[WARN] No agents found in dist/sdd/agents/ - might be located elsewhere${NC}"
    # Try to find any agent files in dist/sdd/
    if find "${SCRIPT_DIR}/dist/sdd/" -name "*.md" -path "*/agents/*" | grep -q .; then
        print_color "${GRAY}  Trying alternative agent locations...${NC}"
        cp "${SCRIPT_DIR}/dist/sdd/"**/agents/*.md "${TARGET_DIR}/.opencode/agents/" 2>/dev/null || true
        AGENT_COUNT=$(find "${TARGET_DIR}/.opencode/agents" -type f | wc -l)
    else
        AGENT_COUNT=0
    fi
fi

FILE_COUNT=$(find "${TARGET_DIR}/.opencode/plugins/sdd" -type f | wc -l)
print_color "${GREEN}[OK] Copied $FILE_COUNT plugin files + $AGENT_COUNT agents${NC}"

# Step 5: Version Detection
print_color "${CYAN}[5/7] Version Detection...${NC}"

# Get source version from dist directory's package.json
SOURCE_PKG_PATH="${SCRIPT_DIR}/dist/sdd/package.json"
if [ -f "$SOURCE_PKG_PATH" ]; then
    SOURCE_VERSION=$(node -p "require('$SOURCE_PKG_PATH').version" 2>/dev/null || echo "")
    if [ -z "$SOURCE_VERSION" ]; then
        SOURCE_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$SOURCE_PKG_PATH" | cut -d'"' -f4)
    fi
else
    # Fallback: Get version from original source package.json
    SOURCE_PKG_PATH_FOR_VERSION="${SCRIPT_DIR}/package.json"
    SOURCE_VERSION=$(node -p "require('$SOURCE_PKG_PATH_FOR_VERSION').version" 2>/dev/null || echo "")
    if [ -z "$SOURCE_VERSION" ]; then
        SOURCE_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$SOURCE_PKG_PATH_FOR_VERSION" | cut -d'"' -f4)
    fi
fi

# Get target version if it exists
TARGET_VERSION=""
PLUGINS_DIR="${TARGET_DIR}/.opencode/plugins/sdd"
if [ -f "${TARGET_DIR}/.opencode/plugins/sdd/package.json" ]; then
    TARGET_VERSION=$(node -p "require('${TARGET_DIR}/.opencode/plugins/sdd/package.json').version" 2>/dev/null || echo "")
    if [ -z "$TARGET_VERSION" ]; then
        TARGET_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "${TARGET_DIR}/.opencode/plugins/sdd/package.json" | cut -d'"' -f4)
    fi
elif [ -f "${TARGET_DIR}/package.json" ]; then
    # If plugin doesn't have its own package.json, check root
    TARGET_VERSION=$(node -p "require('${TARGET_DIR}/package.json').version" 2>/dev/null || echo "")
    if [ -z "$TARGET_VERSION" ]; then
        TARGET_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "${TARGET_DIR}/package.json" | cut -d'"' -f4)
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

# First, let's identify the source of truth for opencode.json
OPENCODE_JSON_SOURCE="${SCRIPT_DIR}/dist/sdd/opencode.json"
if [ ! -f "$OPENCODE_JSON_SOURCE" ]; then
    # Fallback to source template if packed version doesn't have it
    OPENCODE_JSON_SOURCE="${SCRIPT_DIR}/dist/opencode.json"
    if [ ! -f "$OPENCODE_JSON_SOURCE" ]; then
        # Last resort: use a generated one
        OPENCODE_JSON_SOURCE="/tmp/generated_opencode.json"
        cat > "$OPENCODE_JSON_SOURCE" << 'EOF'
{
  "$schema": "https://opencode.ai/schemas/opencode.v1.json",
  "plugin": [
    "opencode-sdd-plugin"
  ],
  "agent": {
    "sdd": "Smart SDD workflow router agent",
    "sdd-0-discovery": "Deep requirement analysis agent",
    "sdd-1-spec": "Specification expert",
    "sdd-2-plan": "Technical planning expert",
    "sdd-3-tasks": "Task breakdown expert",
    "sdd-4-build": "Implementation expert",
    "sdd-5-review": "Code review expert",
    "sdd-6-validate": "Validation expert",
    "sdd-roadmap": "Roadmap planning",
    "sdd-docs": "Directory navigation generator"
  },
  "permission": ["fs", "process", "network"]
}
EOF
    fi
fi

OPENCODE_JSON_PATH="${TARGET_DIR}/opencode.json"

if [ -f "$OPENCODE_JSON_PATH" ]; then
    print_color "${CYAN}[CONFIG MERGE]${NC}"
    print_color "${GREEN}✅ Existing opencode.json found${NC}"
    
    # Perform smart merge using Node.js
    if node -e "
const fs = require('fs');
try {
    // Read existing and new config
    const existingConfig = JSON.parse(fs.readFileSync('${OPENCODE_JSON_PATH}', 'utf-8'));
    const newConfig = JSON.parse(fs.readFileSync('${OPENCODE_JSON_SOURCE}', 'utf-8'));
    
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
        cp "${OPENCODE_JSON_SOURCE}" "${OPENCODE_JSON_PATH}"
        print_color "${GREEN}[OK] Copied new opencode.json (original backed up as .failed_backup)${NC}"
    fi

else
    # No existing file - just copy
    print_color "${CYAN}ℹ️  No existing opencode.json, copying new config${NC}"
    cp "${OPENCODE_JSON_SOURCE}" "${OPENCODE_JSON_PATH}"
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
EOF

print_color "${GREEN}[OK] Created .sdd/README.md${NC}"

# Create .sdd/specs-tree-root/README.md
cat > "${TARGET_DIR}/.sdd/specs-tree-root/README.md" << 'EOF'
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

print_color "${GREEN}[OK] Created .sdd/specs-tree-root/README.md${NC}"

# Done
echo ""
print_color "${GREEN}=== Installation Complete ===${NC}"
echo ""
print_color "Installed to: ${TARGET_DIR}"
echo ""
echo "Files:"
echo "  - .opencode/plugins/sdd/ ($FILE_COUNT files from dist/sdd/src/)"
echo "  - .opencode/agents/ ($AGENT_COUNT agents from dist/sdd/agents/ or alternative location)"
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