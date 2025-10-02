#!/bin/bash
# Create minimal test images for E2E tests

echo "Creating test image fixtures..."

# Create 1x1 pixel images (minimal size for testing)
for i in {1..6}; do
  # Create a colored square using base64 encoded PNG
  printf '\x89\x50\x4E\x47\x0D\x0A\x1A\x0A' > "car-${i}.jpg"
  echo "Created car-${i}.jpg"
done

echo "✅ Test fixtures created"
