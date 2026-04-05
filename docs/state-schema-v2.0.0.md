# State Schema v2.0.0

This document describes the State Schema v2.0.0 used for distributed workflow state management.

## Overview

State Schema v2.0.0 provides a standardized format for tracking the workflow state of features in the SDD (Specification Driven Development) process. It supports the 6 standard workflow phases of the SDD methodology:

1. `specified` - Specification completed
2. `planned` - Planning completed  
3. `tasked` - Task breakdown completed
4. `building` - Implementation in progress
5. `reviewed` - Review completed
6. `validated` - Validation completed

## Structure

The schema includes:

- Basic information (feature ID, name, version)
- Current workflow status and phase
- Phase history with timestamps and triggers
- File references for all generated artifacts
- Dependencies on other features and blocked features
- Metadata for priority and timing
- General history of status changes and comments

## Validation

Each state object can be validated using the `validateState()` function which checks:

- Required fields exist with correct types
- Status is one of the defined workflow statuses
- Phase is between 1-6
- History items have correct structure
- File references have required elements
- Dependencies are properly formatted arrays

## Usage

Import the types and validator as needed:

```typescript
import { StateV2_0_0, validateState } from './path/to/schema-v2.0.0';
```

Then use the validation function to verify state objects before processing them.