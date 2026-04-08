# SDDU Workspace (Standard)

## Directory Structure

```
.sddu/
├── README.md              # This file - SDDU workspace explanation  
├── ROADMAP.md             # Version roadmap
├── docs/                  # Documentation directory  
├── config.json            # SDDU Configuration (optional)
└── specs-tree-root/       # Specification files directory (SDDU Standard)
    ├── README.md          # Directory explanation 
    └── specs-tree-[feature]/         # Feature directory (SDDU naming)
        ├── discovery.md   # Requirement Discovery (Stage 0/6) 
        ├── spec.md        # Specification document
        ├── plan.md        # Technical plan  
        ├── tasks.md       # Task breakdown
        ├── build.md       # Implementation (Stage 4/6)
        ├── review.md      # Code review (Stage 5/6)
        ├── validation.md  # Validation (Stage 6/6)
        └── state.json     # State file
```

## Quick Start

Use SDDU commands:
- `@sddu start [feature name]` - Start new feature
- `@sddu-discovery [topic]` - Discover requirements (Stage 0/6!)
- `@sddu-spec [feature]` - Write specification

## Features

- 6-stage workflow (Discovery → Spec → Plan → Tasks → Build → Review → Validate)
- Standardized directory structure
- Self-maintaining documentation
