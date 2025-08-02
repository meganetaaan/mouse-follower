#!/bin/bash

# Extract file path from JSON input and run lint/format if it's a supported file type
FILE_PATH=$(echo "$1" | jq -r '.tool_input.file_path | select(endswith(".js") or endswith(".ts") or endswith(".jsx") or endswith(".tsx") or endswith(".json") or endswith(".css"))')

if [ -n "$FILE_PATH" ]; then
    echo "Running lint/format on: $FILE_PATH" >&2
    
    # Run npm run check:fix and capture both stdout and stderr
    if ! npm run check:fix "$FILE_PATH" 2>&1; then
        echo "Lint/format failed for: $FILE_PATH" >&2
        exit 2  # Exit code 2 sends stderr to Claude
    fi
    
    echo "Lint/format completed successfully for: $FILE_PATH" >&2
fi