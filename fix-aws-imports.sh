#!/bin/bash

# Fix AWS Amplify imports to prepare for Appwrite migration
echo "🔧 Fixing AWS Amplify imports for Appwrite migration..."

# Fix messaging.service.ts
echo "Fixing messaging.service.ts..."
sed -i 's/import { DataStore } from '\''aws-amplify'\'';/\/\/ AWS DataStore removed - using Appwrite database/' src/services/messaging.service.ts

# Fix process-orchestrator.service.ts  
echo "Fixing process-orchestrator.service.ts..."
sed -i 's/import { DataStore } from '\''aws-amplify'\'';/\/\/ AWS DataStore removed - using Appwrite database/' src/services/process-orchestrator.service.ts

# Fix enhanced-auth.service.ts (already partially fixed)
echo "Enhanced auth service already updated..."

# Comment out old service files that reference AWS
echo "Commenting out old AWS service references..."

# Rename .old files to prevent imports
for file in src/services/*.old.ts; do
    if [ -f "$file" ]; then
        mv "$file" "${file}.disabled"
        echo "Disabled: $file"
    fi
done

echo "✅ AWS import fixes completed!"