#!/bin/bash
echo "🚨 Emergency build starting..."

# Try different build methods in order of preference
if npm run build:emergency; then
    echo "✅ Emergency build successful"
elif npm run build:production; then
    echo "✅ Production build successful"
elif npm run build; then
    echo "✅ Standard build successful"
else
    echo "❌ All build methods failed"
    exit 1
fi

echo "🎉 Build completed successfully!"
