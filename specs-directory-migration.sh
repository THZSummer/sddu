#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting directory migration..."
echo "From: .sdd/.specs/"
echo "To: .sdd/specs-tree-root/"

# Check if source directory exists
if [ ! -d ".sdd/.specs" ]; then
    echo "Error: Source directory .sdd/.specs does not exist!"
    exit 1
fi

# Phase 1: Root directory rename - .specs → specs-tree-root
echo "Phase 1: Renaming .sdd/.specs to .sdd/specs-tree-root"
mv .sdd/.specs .sdd/specs-tree-root
echo "Phase 1: Completed ✓"

# Phase 2: Subdirectory rename - add specs-tree- prefix to all subdirectories
echo "Phase 2: Adding specs-tree- prefix to all subdirectories"
cd .sdd/specs-tree-root/

for dir in */; do
    if [ -d "$dir" ]; then
        dir_name="${dir%/}"
        # Skip already prefixed directories
        if [[ ! "$dir_name" =~ ^specs-tree- ]]; then
            new_name="specs-tree-$dir_name"
            echo "Renaming $dir_name -> $new_name"
            mv "$dir_name" "$new_name"
        fi
    fi
done

cd - > /dev/null
echo "Phase 2: Completed ✓"

# Phase 3: Delete temporary directories (.templates/, examples/)
echo "Phase 3: Deleting temporary directories"
if [ -d ".templates" ]; then
    rm -rf .templates
    echo "Deleted .templates/"
fi
if [ -d "examples" ]; then
    rm -rf examples
    echo "Deleted examples/"
fi
echo "Phase 3: Completed ✓"

# Phase 4: Handle ROADMAP.md if it exists
echo "Phase 4: Handling ROADMAP.md"
if [ -f ".sdd/specs-tree-root/ROADMAP.md" ]; then
    mv .sdd/specs-tree-root/ROADMAP.md .sdd/ROADMAP.md
    echo "Moved ROADMAP.md to .sdd/ROOTMAP.md"
fi
echo "Phase 4: Completed ✓"

# Phase 5: Delete unnecessary directories within .sdd
echo "Phase 5: Deleting .sdd/docs/, .sdd/src/, .sdd/tests/"
if [ -d ".sdd/docs" ]; then
    rm -rf .sdd/docs
    echo "Deleted .sdd/docs/"
fi
if [ -d ".sdd/src" ]; then
    rm -rf .sdd/src
    echo "Deleted .sdd/src/"
fi
if [ -d ".sdd/tests" ]; then
    rm -rf .sdd/tests
    echo "Deleted .sdd/tests/"
fi
echo "Phase 5: Completed ✓"

echo "Directory migration completed successfully!"
echo "New structure: .sdd/specs-tree-root/ with properly prefixed subdirectories"