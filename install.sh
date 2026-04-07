#!/usr/bin/env bash
# SDDU Plugin Installer (Linux/macOS) 
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
print_color "${CYAN}=== SDDU Plugin Installer ===${NC}"
print_color "Source: ${SCRIPT_DIR}"
print_color "Target: ${TARGET_DIR}"
echo ""

# Show SDD → SDDU Upgrade Information
print_color "${CYAN}[INFO] SDD to SDDU Migration Support${NC}"
print_color "${GREEN}This installer supports both SDD and SDDU formats${NC}"
print_color "${GREEN}All @sdd-* commands will continue to work for backward compatibility${NC}"
print_color "${GREEN}Recommend using @sddu-* commands for new projects${NC}"
echo ""

# Step 1: Check source
print_color "${CYAN}[1/7] Checking source...${NC}"
if [ ! -f "${SCRIPT_DIR}/package.json" ]; then
    print_color "${RED}ERROR: package.json not found${NC}"
    exit 1
fi
print_color "${GREEN}[OK] Source validated${NC}"

# Step 2: Check for prebuilt dist/sdd or dist/sddu directory
print_color "${CYAN}[2/7] Locating distribution files...${NC}"

DIST_SDDU_DIR="${SCRIPT_DIR}/dist/sddu"
DIST_SDD_DIR="${SCRIPT_DIR}/dist/sdd"
DIST_SDDU_ARCHIVE="${SCRIPT_DIR}/dist/sddu.zip"
DIST_SDD_ARCHIVE="${SCRIPT_DIR}/dist/sdd.zip"

if [ -d "$DIST_SDDU_DIR" ]; then
    print_color "${GREEN}[OK] Using SDDU pre-built distribution in dist/sddu/${NC}"
elif [ -d "$DIST_SDD_DIR" ]; then
    print_color "${GREEN}[OK] Using SDD pre-built distribution in dist/sdd/${NC}"
    print_color "${YELLOW}[INFO] Maintaining backward compatibility${NC}"
else
    print_color "${YELLOW}[INFO] Pre-built distribution not found, checking for archives...${NC}"
    if [ -f "$DIST_SDDU_ARCHIVE" ] || [ -f "$DIST_SDD_ARCHIVE" ]; then
        # Use SDDU archive first if available, fallback to SDD
        if [ -f "$DIST_SDDU_ARCHIVE" ]; then
            print_color "${GREEN}[INFO] SDDU archive found at $DIST_SDDU_ARCHIVE, unpacking...${NC}"
            mkdir -p "${SCRIPT_DIR}/dist/sddu"
            unzip -q "${DIST_SDDU_ARCHIVE}" -d "${SCRIPT_DIR}/dist/tmp_extract_sddu"
            mv "${SCRIPT_DIR}/dist/tmp_extract_sddu/sddu" "${SCRIPT_DIR}/dist/sddu" 2>/dev/null || \
            mv "${SCRIPT_DIR}/dist/tmp_extract_sddu/sdd" "${SCRIPT_DIR}/dist/sddu"  # In case archive has different name
            rm -r "${SCRIPT_DIR}/dist/tmp_extract_sddu" 2>/dev/null || true
            print_color "${GREEN}[OK] SDDU archive extracted to dist/sddu/${NC}"
        elif [ -f "$DIST_SDD_ARCHIVE" ]; then
            print_color "${GREEN}[INFO] SDD archive found at $DIST_SDD_ARCHIVE, unpacking...${NC}"
            mkdir -p "${SCRIPT_DIR}/dist/sdd"
            unzip -q "${DIST_SDD_ARCHIVE}" -d "${SCRIPT_DIR}/dist/tmp_extract"
            mv "${SCRIPT_DIR}/dist/tmp_extract/sdd" "${SCRIPT_DIR}/dist/sdd"
            rm -r "${SCRIPT_DIR}/dist/tmp_extract"
            print_color "${GREEN}[OK] SDD archive extracted to dist/sdd/${NC}"
        fi
    else
        print_color "${YELLOW}[WARN] No pre-built distributions found, building from source...${NC}"
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

        # Now run the packaging script to create both distribution packages
        print_color "${GRAY}  Creating distribution packages...${NC}"
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

# Support both .sddu and .sdd directories for SDDU and backward compatibility
for dir in "${TARGET_DIR}/.opencode/plugins/sddu" "${TARGET_DIR}/.opencode/plugins/sdd" "${TARGET_DIR}/.opencode/agents" "${TARGET_DIR}/.sddu" "${TARGET_DIR}/.sdd" "${TARGET_DIR}/.sdd/specs-tree-root" "${TARGET_DIR}/.sddu/specs-tree-root"; do
    if [ -d "$dir" ]; then
        print_color "${YELLOW}[INFO] Path exists: $dir${NC}"
    else
        mkdir -p "$dir"
        print_color "${GREEN}[OK] Created: $dir${NC}"
    fi
done

# Step 4: Copy plugins - both SDDU and legacy SDD for backward compatibility
print_color "${CYAN}[4/7] Copying plugins from distribution directories...${NC}"
SDDU_PLUGIN_DEST="${TARGET_DIR}/.opencode/plugins/sddu"
SDD_PLUGIN_DEST="${TARGET_DIR}/.opencode/plugins/sdd"

copy_distribution_to_plugin() {
    local source_dir="$1"
    local dest_dir="$2"
    local version_label="$3"
    
    if [ -d "$source_dir" ]; then
        print_color "${CYAN}  Copying ${version_label} plugin from ${source_dir}...${NC}"
        # Clean destination first
        if [ -d "$dest_dir" ]; then
            rm -rf "$dest_dir"
        fi
        mkdir -p "$dest_dir"
        
        # Copy the entire source directory contents
        cp -r "$source_dir/"* "$dest_dir/"
        
        count=$(find "$dest_dir" -type f | wc -l)
        print_color "${GREEN}[OK] Copied $count ${version_label} plugin files${NC}"
        return 0
    else
        print_color "${YELLOW}[INFO] ${version_label} plugin source not found: $source_dir${NC}"
        return 1
    fi
}

# Copy SDDU version if available
if ! copy_distribution_to_plugin "${SCRIPT_DIR}/dist/sddu" "$SDDU_PLUGIN_DEST" "SDDU"; then
    # Fallback to SDD version for SDDU destination if SDDU not built yet
    copy_distribution_to_plugin "${SCRIPT_DIR}/dist/sdd" "$SDDU_PLUGIN_DEST" "SDD (using as SDDU fallback)"
fi

# Copy SDD version for backward compatibility
copy_distribution_to_plugin "${SCRIPT_DIR}/dist/sdd" "$SDD_PLUGIN_DEST" "SDD (backward compatibility)"

# Copy agents from source to .opencode/agents/ - copy from both sources to ensure all agents are available
if [ -d "${SCRIPT_DIR}/dist/sddu/agents" ]; then
    print_color "${GRAY}  Copying SDDU agents from dist/sddu/agents/...${NC}"
    cp "${SCRIPT_DIR}/dist/sddu/agents/"* "${TARGET_DIR}/.opencode/agents/" 2>/dev/null || print_color "${GRAY}  SDDU agents not found, continuing...${NC}"
fi
if [ -d "${SCRIPT_DIR}/dist/sdd/agents" ]; then
    print_color "${GRAY}  Copying legacy SDD agents...${NC}"
    cp "${SCRIPT_DIR}/dist/sdd/agents/"* "${TARGET_DIR}/.opencode/agents/" 2>/dev/null || print_color "${GRAY}  Legacy agents not found, continuing...${NC}"
fi

# Count agents copied
AGENT_COUNT=$(find "${TARGET_DIR}/.opencode/agents" -type f | wc -l)
print_color "${GREEN}[OK] Total agents copied: $AGENT_COUNT${NC}"

# Step 5: Version Detection
print_color "${CYAN}[5/7] Version Detection...${NC}"

# Get source version from SDDU directory first
SOURCE_PKG_PATH="${SCRIPT_DIR}/dist/sddu/package.json"
if [ ! -f "$SOURCE_PKG_PATH" ]; then
    SOURCE_PKG_PATH="${SCRIPT_DIR}/dist/sdd/package.json"
fi

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

print_color "${GREEN}[INFO] Source package version: $SOURCE_VERSION${NC}"

# Step 6: Merge opencode.json (smart merge)
print_color "${CYAN}[6/7] Merging opencode.json for SDDU + backward compatibility...${NC}"

# Prepare SDDU and SDD configurations
OPENCODE_JSON_SOURCE_SDDU="${SCRIPT_DIR}/dist/sddu/opencode.json"
OPENCODE_JSON_SOURCE_SDD="${SCRIPT_DIR}/dist/sdd/opencode.json"
# If either source doesn't exist, construct from original package
if [ ! -f "$OPENCODE_JSON_SOURCE_SDDU" ] || [ ! -f "$OPENCODE_JSON_SOURCE_SDD" ]; then
    # Generate both from original source
    ORIGINAL_PKG_PATH="${SCRIPT_DIR}/package.json"
    ORIGINAL_PKG=$(cat "$ORIGINAL_PKG_PATH")
    NAME=$(echo "$ORIGINAL_PKG" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    
    # Create configuration with SDDU support
    mkdir -p "$(dirname "$OPENCODE_JSON_SOURCE_SDDU")"
    cat > "$OPENCODE_JSON_SOURCE_SDDU" << EOF
{
  "\$schema": "https://opencode.ai/schemas/opencode.v1.json",
  "plugin": [
    "opencode-sddu-plugin",
    "opencode-sdd-plugin"
  ],
  "agent": {
    "sddu": "Smart SDDU workflow router agent (recommended)",
    "sdd": "Smart SDD workflow router agent (backward compatibility)",
    "sddu-help": "SDDU Help assistant (recommended)", 
    "sdd-help": "SDD Help assistant (backward compatibility)",
    "sddu-discovery": "SDDU Deep requirement analysis agent (Stage 0/6)",
    "sdd-discovery": "SDD Deep requirement analysis agent, deprecated (Stage 0/6)",
    "sddu-0-discovery": "SDDU Requirement Discovery with phase indication (Stage 0/6)",
    "sdd-0-discovery": "SDD Requirement Discovery, deprecated (Stage 0/6)",
    "sddu-1-spec": "SDDU Specification expert (Phase 1/6)",
    "sdd-1-spec": "SDD Specification expert, deprecated (Phase 1/6)",
    "sddu-2-plan": "SDDU Technical planning expert (Phase 2/6)",
    "sdd-2-plan": "SDD Technical planning expert, deprecated (Phase 2/6)",
    "sddu-3-tasks": "SDDU Task breakdown expert (Phase 3/6)",
    "sdd-3-tasks": "SDD Task breakdown expert, deprecated (Phase 3/6)",
    "sddu-4-build": "SDDU Implementation expert (Phase 4/6)",
    "sdd-4-build": "SDD Implementation expert, deprecated (Phase 4/6)",
    "sddu-5-review": "SDDU Code review expert (Phase 5/6)",
    "sdd-5-review": "SDD Code review expert, deprecated (Phase 5/6)",
    "sddu-6-validate": "SDDU Validation expert (Phase 6/6)",
    "sdd-6-validate": "SDD Validation expert, deprecated (Phase 6/6)",
    "sddu-roadmap": "SDDU Roadmap planning agent (recommended)",
    "sdd-roadmap": "SDD Roadmap planning agent, backward compatibility",
    "sddu-docs": "SDDU Directory navigation generator (recommended)",
    "sdd-docs": "SDD Directory navigation generator, backward compatibility"
  },
  "permission": ["fs", "process", "network"]
}
EOF

    # Also create a similar config for SDD (mostly deprecated versions)
    ORIGINAL_PKG_PATH="${SCRIPT_DIR}/package.json"
    ORIGINAL_PKG=$(cat "$ORIGINAL_PKG_PATH")
    NAME=$(echo "$ORIGINAL_PKG" | grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    
    mkdir -p "$(dirname "$OPENCODE_JSON_SOURCE_SDD")"
    cat > "$OPENCODE_JSON_SOURCE_SDD" << EOF
{
  "\$schema": "https://opencode.ai/schemas/opencode.v1.json",
  "plugin": [
    "opencode-sdd-plugin",
    "opencode-sddu-plugin"
  ],
  "agent": {
    "sdd": "Smart SDD workflow router agent",
    "sddu": "Smart SDDU workflow router agent (recommended new)",
    "sdd-help": "SDD Help assistant",
    "sddu-help": "SDDU Help assistant (recommended new)", 
    "sdd-discovery": "SDD Deep requirement analysis agent (Stage 0/6)",
    "sddu-discovery": "SDDU Deep requirement analysis agent, recommended (Stage 0/6)",
    "sdd-0-discovery": "SDD Requirement Discovery (Stage 0/6)",
    "sddu-0-discovery": "SDDU Requirement Discovery, recommended (Stage 0/6)",
    "sdd-1-spec": "SDD Specification expert (Phase 1/6)",
    "sddu-1-spec": "SDDU Specification expert, recommended (Phase 1/6)",
    "sdd-2-plan": "SDD Technical planning expert (Phase 2/6)",
    "sddu-2-plan": "SDDU Technical planning expert, recommended (Phase 2/6)",
    "sdd-3-tasks": "SDD Task breakdown expert (Phase 3/6)",
    "sddu-3-tasks": "SDDU Task breakdown expert, recommended (Phase 3/6)",
    "sdd-4-build": "SDD Implementation expert (Phase 4/6)",
    "sddu-4-build": "SDDU Implementation expert, recommended (Phase 4/6)",
    "sdd-5-review": "SDD Code review expert (Phase 5/6)",
    "sddu-5-review": "SDDU Code review expert, recommended (Phase 5/6)",
    "sdd-6-validate": "SDD Validation expert (Phase 6/6)",
    "sddu-6-validate": "SDDU Validation expert, recommended (Phase 6/6)",
    "sdd-roadmap": "SDD Roadmap planning agent",
    "sddu-roadmap": "SDDU Roadmap planning agent, recommended",
    "sdd-docs": "SDD Directory navigation generator",
    "sddu-docs": "SDDU Directory navigation generator, recommended"
  },
  "permission": ["fs", "process", "network"]
}
EOF
fi

OPENCODE_JSON_PATH="${TARGET_DIR}/opencode.json"

if [ -f "$OPENCODE_JSON_PATH" ]; then
    print_color "${CYAN}[CONFIG MERGE]${NC}"
    print_color "${GREEN}✅ Existing opencode.json found, upgrading for SDD/SDDU compatibility${NC}"
    
    # Perform smart merge using Node.js considering new agent definitions
    if node -e "
const fs = require('fs');
try {
    // Read existing and new configs
    const existingConfig = JSON.parse(fs.readFileSync('${OPENCODE_JSON_PATH}', 'utf-8'));
    const newConfig = JSON.parse(fs.readFileSync('${OPENCODE_JSON_SOURCE_SDDU}', 'utf-8'));  // Use SDDU as primary
    
    // Create backup
    fs.writeFileSync('${OPENCODE_JSON_PATH}.backup', JSON.stringify(existingConfig, null, 2));
    
    // Merge plugin list with both SDD and SDDU (deduplicate)
    const existingPlugin = Array.isArray(existingConfig.plugin) ? existingConfig.plugin : [];
    const newPlugin = Array.isArray(newConfig.plugin) ? newConfig.plugin : [];
    existingConfig.plugin = [...new Set([...existingPlugin, ...newPlugin])];
    
    // Merge agent definitions - preserve existing, add/update new ones
    const mergedAgents = { ...(existingConfig.agent || {}) };
    for (const [agentName, agentDef] of Object.entries(newConfig.agent || {})) {
        if (agentName in mergedAgents) {
            // Keep existing descriptions if the same agent exists but use new capabilities as needed
            if (typeof agentDef === 'string') {
                mergedAgents[agentName] = agentDef; // Just update/refresh
            } else if (typeof agentDef === 'object') {
                // If both are objects, merge properties
                mergedAgents[agentName] = { ...mergedAgents[agentName], ...agentDef };
            }
        } else {
            // New agent - add it
            mergedAgents[agentName] = agentDef;
        }
    }
    existingConfig.agent = mergedAgents;
    
    // Prefer new permissions settings
    existingConfig.permission = newConfig.permission || existingConfig.permission;
    
    // Maintain schema from new config
    if (newConfig.\$schema) {
        existingConfig.\$schema = newConfig.\$schema;
    }
    
    // Write merged config
    fs.writeFileSync('${OPENCODE_JSON_PATH}', JSON.stringify(existingConfig, null, 2));
    
    // Count changes
    const allAgents = Object.keys({ ...(existingConfig.agent || {}), ...(newConfig.agent || {}) });
    console.log('PLUGINS_UPDATED:' + newPlugin.length);
    console.log('AGENTS_TOTAL:' + allAgents.length); 
    console.log('CUSTOM_AGENTS_PRESERVED:' + Object.keys(existingConfig.agent || {}).length);
    
} catch (error) {
    console.error('MERGE_ERROR:', error.message);
    process.exit(1);
}
" > /tmp/sddu_merge_result.txt 2>/dev/null; then
    
        # Extract results from the output
        PLUGINS_UPDATED=$(grep "PLUGINS_UPDATED:" /tmp/sddu_merge_result.txt | cut -d':' -f2)
        AGENTS_TOTAL=$(grep "AGENTS_TOTAL:" /tmp/sddu_merge_result.txt | cut -d':' -f2)
        CUSTOM_AGENTS_PRESERVED=$(grep "CUSTOM_AGENTS_PRESERVED:" /tmp/sddu_merge_result.txt | cut -d':' -f2)
        
        print_color "${GREEN}✅ Plugins updated: $PLUGINS_UPDATED plugins in system${NC}"
        print_color "${GREEN}✅ Agents configured: $AGENTS_TOTAL agents available${NC}"
        print_color "${GREEN}✅ Custom agents maintained: $CUSTOM_AGENTS_PRESERVED existing configurations preserved${NC}"
    
    else
        # If merge fails, backup original and copy new SDDU config
        print_color "${YELLOW}[WARN] Config merge failed, copying SDDU config and backing up original${NC}"
        cp "${OPENCODE_JSON_PATH}" "${OPENCODE_JSON_PATH}.failed_backup"
        cp "${OPENCODE_JSON_SOURCE_SDDU}" "${OPENCODE_JSON_PATH}"
        print_color "${GREEN}[OK] Copied new SDDU opencode.json (original backed up as .failed_backup)${NC}"
    fi

else
    # No existing file - just copy with SDDU config as primary
    print_color "${CYAN}ℹ️  No existing opencode.json, creating SDDU-compatible config${NC}"
    cp "${OPENCODE_JSON_SOURCE_SDDU}" "${OPENCODE_JSON_PATH}"
    print_color "${GREEN}[OK] Created new SDDU opencode.json${NC}"
fi

# Step 7: Initialize .sdd/ and .sddu/ directory structures
print_color "${CYAN}[7/7] Initializing SDD and SDDU workspace directories...${NC}"

# Create main SDD directory structure
cat > "${TARGET_DIR}/.sdd/README.md" << 'EOF'
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

1. 使用 `@sdd 开始 [feature 名称]` 或新的 `@sddu 开始 [feature 名称]` 开始新 feature
2. 规范文件将自动创建在 `.sdd/specs-tree-root/` or `.sddu/specs-tree-root/` 目录
3. 文档会自动维护，无需手动创建 README

## SDD 与 SDDU 对照 (Migration Ready)

| SDD 旧版命令 | SDDU 新版命令 | 状态 |
|--------------|---------------|------|
| `@sdd` | `@sddu` | ✅ 推荐使用 |
| `@sdd-help` | `@sddu-help` | ✅ 推荐使用 | 
| `@sdd-xxx` | `@sddu-xxx` | ✅ 推荐使用新命令 |
| `@sdd-xxx` | `@sdd-xxx` | ⚠️ 继续支持但不推荐 |

**所有 SDD 命令将继续正常工作**用于向后兼容！


## Agents

- `@sdd` / `@sddu` - 智能入口 (新)
- `@sdd-docs` / `@sddu-docs` - 目录导航（自动触发）  
- `@sdd-roadmap` / `@sddu-roadmap` - Roadmap 规划
EOF

# Create SDDU specific directory structure
cat > "${TARGET_DIR}/.sddu/README.md" << 'EOF'
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

1. Use `@sddu 开始 [feature name]` to start a new feature
2. Documentation maintains itself (@sddu-docs)

## Migration Status

This project supports both SDD and SDDU workflows:
- ✅ Original SDD commands still work (backward compatibility) 
- ✅ New SDDU commands available (recommended forward path)
- ✅ Mixed usage allowed during transition
EOF

# Create .sdd/specs-tree-root/README.md
cat > "${TARGET_DIR}/.sdd/specs-tree-root/README.md" << 'EOF'
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
EOF

# Create .sddu/specs-tree-root/README.md  
cat > "${TARGET_DIR}/.sddu/specs-tree-root/README.md" << 'EOF'
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
- `@sddu 开始 [feature name]` - Start new feature
- `@sddu-discovery [topic]` - Discover requirements first stage 0/6!
- `@sddu-spec [feature]` - Write specification

## Migration Notes

This directory follows the new SDDU standard while maintaining compatibility.
EOF

print_color "${GREEN}[OK] Created .sdd/ and .sddu/ README files${NC}"

# Done
echo ""
print_color "${GREEN}=== SDDU Installation Complete ===${NC}"
echo ""
print_color "Installed to: ${TARGET_DIR}"
echo ""
echo "Files:"
echo "  - .opencode/plugins/sddu/ ($([ -d ${TARGET_DIR}/.opencode/plugins/sddu ] && find ${TARGET_DIR}/.opencode/plugins/sddu -type f | wc -l || echo 0) files from SDDU dist/)"
echo "  - .opencode/plugins/sdd/ ($([ -d ${TARGET_DIR}/.opencode/plugins/sdd ] && find ${TARGET_DIR}/.opencode/plugins/sdd -type f | wc -l || echo 0) files from SDD dist/ for backward compatibility)"
echo "  - .opencode/agents/ ($AGENT_COUNT agents total)"
echo "  - opencode.json (plugin configuration - with SDDU+SDD dual support)"
echo "  - .sdd/ and .sddu/ (workspace containers)"
echo ""
echo "  🎉 NEW Feature: Stage 0 (Discovery phase) is now available!"
echo "    - @sddu-discovery / @sdd-discovery - Deep requirement analysis (Stage 0/6)"
echo "    - @sddu-0-discovery / @sdd-0-discovery - Full name version"
echo ""
print_color "${CYAN}Agents installed ($AGENT_COUNT total):${NC}"
echo "  Recommended (SDDU):"
echo "    @sddu              - Smart entry point (recommended)"
echo "    @sddu-help         - Help assistant (recommended)"
echo "    @sddu-discovery    - Requirement Discovery (Stage 0/6, recommended)"
echo "    @sddu-0-discovery  - Requirement Discovery full name (Stage 0/6, recommended)"
echo "    @sddu-1-spec       - Specification (Phase 1/6, recommended)"  
echo "    @sddu-2-plan       - Technical planning (Phase 2/6, recommended)"
echo "    @sddu-3-tasks      - Task breakdown (Phase 3/6, recommended)"
echo "    @sddu-4-build      - Implementation (Phase 4/6, recommended)"
echo "    @sddu-5-review     - Code review (Phase 5/6, recommended)"
echo "    @sddu-6-validate   - Validation (Phase 6/6, recommended)"
echo ""
echo "  Legacy (SDD, backward compatible): "
echo "    @sdd              - Smart entry point"
echo "    @sdd-help         - Help assistant"  
echo "    @sdd-discovery    - Requirement Discovery (Stage 0/6)"
echo "    @sdd-0-discovery  - Requirement Discovery full name (Stage 0/6)"
echo "    @sdd-1-spec       - Specification (Phase 1/6)"
echo "    ..."
echo "  All legacy commands continue to work unchanged!"
echo ""
print_color "${CYAN}Quick Start Options:${NC}"
echo "  cd '${TARGET_DIR}'"
echo "  opencode"
echo "  For SDDU (new): @sddu 开始 [feature name]"
echo "  For SDD (legacy): @sdd 开始 [feature name] (still works!)"
echo "  For discovery: @sddu-discovery [topic] or @sdd-discovery [topic]" 
echo ""
print_color "${GRAY}Migration Information:${NC}"
echo "  - SDDU is the new recommended approach"
echo "  - SDD commands will continue to work (backward compatibility)"
echo "  - Gradual migration is supported"
echo "  - Mixed use of both systems is acceptable"
echo ""
print_color "✅ Installation complete. Ready to start your specifications!"
echo ""