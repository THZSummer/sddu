#!/bin/bash
# scripts/e2e/tree-scenario/setup.sh
# Creates the standard tree structure for E2E tests - FR-120

set -e

SPEC_ROOT=".sddu/specs-tree-root"
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Clean up any previous test data (EC-107)
rm -rf "$SPEC_ROOT/specs-tree-e2e-parent" || true
rm -rf "$SPEC_ROOT/specs-tree-e2e-standalone" || true

echo "🔄 Setting up tree structure test scenario..."

# === Create the parent Feature ===
echo "📁 Creating parent feature: specs-tree-e2e-parent"
mkdir -p "$SPEC_ROOT/specs-tree-e2e-parent"

cat > "$SPEC_ROOT/specs-tree-e2e-parent/discovery.md" << 'EOF'
# Discovery: E2E 测试父级

This serves as a parent feature for automated tree structure testing.
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-parent/spec.md" << 'EOF'
# Specification: E2E 测试父级

This is a parent feature that coordinates child features for testing purposes.
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-parent/README.md" << 'EOF'
# E2E Parent Test Feature

## Overview
This is a lightweight parent feature used for tree structure testing.
- Coordinates 2 child features
- Has its own discovery.md and spec.md
- Contains minimal implementation

## Children Features
- specs-tree-e2e-child-a
- specs-tree-e2e-child-b
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-parent/state.json" << EOF
{
  "feature": "specs-tree-e2e-parent",
  "name": "E2E 测试父级",
  "version": "v3.0.0",
  "phase": "planned",
  "status": "tracked",
  "depth": 1,
  "childrens": [],
  "files": { 
    "discovery": "discovery.md", 
    "spec": "spec.md", 
    "readme": "README.md" 
  },
  "dependencies": { 
    "on": [], 
    "blocking": [] 
  },
  "phaseHistory": [
    { 
      "phase": "specified", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "planned", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    }
  ],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF


# === Create child A ===
mkdir -p "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a"

echo "📁 Creating child A: specs-tree-e2e-parent/specs-tree-e2e-child-a"
cat > "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a/discovery.md" << EOF
# Discovery: Child A

## Overview
Child feature A for tree structure testing.
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a/spec.md" << EOF
# Specification: Child A

This child feature A has a dependency on standalone feature.
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-a/state.json" << EOF
{
  "feature": "specs-tree-e2e-parent/specs-tree-e2e-child-a",
  "name": "子级 A",
  "version": "v3.0.0",
  "phase": "tasked",
  "status": "tracked",
  "depth": 2,
  "childrens": [],
  "files": { 
    "discovery": "discovery.md", 
    "spec": "spec.md" 
  },
  "dependencies": {
    "on": ["specs-tree-e2e-standalone"],
    "blocking": []
  },
  "phaseHistory": [
    { 
      "phase": "specified", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "planned", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "tasked", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    }
  ],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF


# === Create child B ===
mkdir -p "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-b"

echo "📁 Creating child B: specs-tree-e2e-parent/specs-tree-e2e-child-b"
cat > "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-b/discovery.md" << EOF
# Discovery: Child B

## Overview
Child feature B for tree structure testing.
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-b/spec.md" << EOF
# Specification: Child B

This child feature B is a separate implementation without dependencies.
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-parent/specs-tree-e2e-child-b/state.json" << EOF
{
  "feature": "specs-tree-e2e-parent/specs-tree-e2e-child-b",
  "name": "子级 B",
  "version": "v3.0.0",
  "phase": "specified",
  "status": "tracked",
  "depth": 2,
  "childrens": [],
  "files": { 
    "discovery": "discovery.md", 
    "spec": "spec.md" 
  },
  "dependencies": { 
    "on": ["specs-tree-e2e-parent/specs-tree-e2e-child-a"],
    "blocking": [] 
  },
  "phaseHistory": [
    { 
      "phase": "specified", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    }
  ],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF


# === Create standalone Feature (depth 1) ===
mkdir -p "$SPEC_ROOT/specs-tree-e2e-standalone"

echo "📁 Creating standalone feature: specs-tree-e2e-standalone"
cat > "$SPEC_ROOT/specs-tree-e2e-standalone/discovery.md" << EOF
# Discovery: Standalone Feature

## Overview
A standalone feature that can be depended upon by other features.
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-standalone/spec.md" << EOF
# Specification: Standalone Feature

This standalone feature does not have parents. It's a dependency target for child A.
EOF

cat > "$SPEC_ROOT/specs-tree-e2e-standalone/state.json" << EOF
{
  "feature": "specs-tree-e2e-standalone",
  "name": "独立 Feature",
  "version": "v3.0.0",
  "phase": "validated",
  "status": "completed",
  "depth": 1,
  "childrens": [],
  "files": { 
    "discovery": "discovery.md", 
    "spec": "spec.md" 
  },
  "dependencies": { 
    "on": [], 
    "blocking": [] 
  },
  "phaseHistory": [
    { 
      "phase": "specified", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "planned", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "tasked", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "builded", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "reviewed", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "validated", 
      "status": "completed", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    }
  ],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF


echo "✅ E2E test scenario structure created:"
echo ""
echo "📁 Project Structure:"
echo "├── specs-tree-e2e-parent/"
echo "│   ├── discovery.md"
echo "│   ├── spec.md"
echo "│   ├── README.md"
echo "│   └── state.json (depth=1)"
echo "│   ├── specs-tree-e2e-child-a/"
echo "│   │   ├── discovery.md"
echo "│   │   ├── spec.md"
echo "│   │   └── state.json (depth=2, dep->standalone)"
echo "│   └── specs-tree-e2e-child-b/"
echo "│       ├── discovery.md"
echo "│       ├── spec.md"
echo "│       └── state.json (depth=2, dep->child-a -- for circular dep TEST)"
echo "└── specs-tree-e2e-standalone/"
echo "    ├── discovery.md"
echo "    ├── spec.md"
echo "    └── state.json (depth=1)"
echo ""

echo "📊 Feature Depths:"
echo "- Parent: depth=1"
echo "- Child A: depth=2" 
echo "- Child B: depth=2"
echo "- Standalone: depth=1"
echo ""
echo "🔗 Dependencies:"
echo "- Child A depends on: specs-tree-e2e-standalone"
echo "- Child B depends on: specs-tree-e2e-child-a (CIRCULAR DEPENDENCY FOR TESTING - FR-123)"

# Update parent's children array to reflect the actual child features
cat > "$SPEC_ROOT/specs-tree-e2e-parent/state.json" << EOF
{
  "feature": "specs-tree-e2e-parent",
  "name": "E2E 测试父级",
  "version": "v3.0.0",
  "phase": "planned",
  "status": "tracked",
  "depth": 1,
  "childrens": [
    {
      "path": "specs-tree-e2e-parent/specs-tree-e2e-child-a",
      "featureName": "子级 A",
      "phase": "tasked",
      "status": "tracked",
      "lastModified": "$NOW"
    },
    {
      "path": "specs-tree-e2e-parent/specs-tree-e2e-child-b",
      "featureName": "子级 B",
      "phase": "specified",
      "status": "tracked",
      "lastModified": "$NOW"
    }
  ],
  "files": { 
    "discovery": "discovery.md", 
    "spec": "spec.md", 
    "readme": "README.md" 
  },
  "dependencies": { 
    "on": [], 
    "blocking": [] 
  },
  "phaseHistory": [
    { 
      "phase": "specified", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    },
    { 
      "phase": "planned", 
      "status": "tracked", 
      "timestamp": "$NOW", 
      "triggeredBy": "setup.sh" 
    }
  ],
  "createdAt": "$NOW",
  "updatedAt": "$NOW"
}
EOF

echo "🔄 Updated parent's childrens array in state.json"
echo ""
echo "✅ E2E test project setup complete!"