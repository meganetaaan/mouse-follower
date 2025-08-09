#!/bin/bash

# Read input from stdin instead of arguments
INPUT=$(cat)
echo "Hook received input: $INPUT" >&2

# Extract file path from JSON input and run lint/format if it's a supported file type
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path | select(endswith(".js") or endswith(".ts") or endswith(".jsx") or endswith(".tsx") or endswith(".json") or endswith(".css"))')

echo "Extracted file path: '$FILE_PATH'" >&2

if [ -n "$FILE_PATH" ]; then
    echo "Running lint/format on: $FILE_PATH" >&2
    
    # Determine which package the file belongs to and run appropriate biome command
    if [[ "$FILE_PATH" == *"/packages/mouse-follower/"* ]]; then
        echo "Running biome on mouse-follower package" >&2
        if ! pnpm --filter @meganetaaan/mouse-follower check:fix 2>&1; then
            echo "Lint/format failed for mouse-follower package" >&2
            exit 2  # Exit code 2 sends stderr to Claude
        fi
    elif [[ "$FILE_PATH" == *"/packages/demo/"* ]]; then
        echo "Running biome on demo package" >&2
        if ! pnpm --filter mouse-follower-demo check:fix 2>&1; then
            echo "Lint/format failed for demo package" >&2
            exit 2  # Exit code 2 sends stderr to Claude
        fi
    else
        echo "File not in a known package, skipping lint/format: $FILE_PATH" >&2
        exit 0
    fi
    
    echo "Lint/format completed successfully for: $FILE_PATH" >&2
fi