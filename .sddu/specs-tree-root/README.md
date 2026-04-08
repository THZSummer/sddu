# SDDU Specification Directory (Standard)

## Directory Structure

```
.sddu/
├── README.md              # This file  
├── specs-tree-root/       # Specification Root Directory (SDDU naming convention)
│   ├── README.md          # This instructions file
│   └── specs-tree-[feature-n]/ # Feature N (SDDU naming convention)
│       ├── discovery.md   # Requirement Discovery (Stage 0/6)
│       ├── spec.md        # Specification document
│       ├── plan.md        # Technical plan  
│       ├── tasks.md       # Task breakdown
│       ├── build.md       # Implementation (Stage 4/6)
│       ├── review.md      # Code review (Stage 5/6)
│       ├── validation.md  # Validation (Stage 6/6)
│       └── state.json     # State file
```

## Quick Start

Use SDDU commands:
- `@sddu start [feature name]` - Start new feature
- `@sddu-discovery [topic]` - Discover requirements first stage 0/6!
- `@sddu-spec [feature]` - Write specification

## New in SDDU

This directory follows the new SDDU standard with 6+1 stage workflow.
