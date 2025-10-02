# Test Fixtures

This directory contains test assets for E2E testing.

## Files Needed:

### Images (for car selling, product uploads):
- `car-1.jpg` through `car-6.jpg` - Test car images
- `test-image.jpg` - Generic test image
- `test-product.jpg` - Product image

### Documents:
- `test-document.pdf` - Sample business document

## Creating Test Images:

You can use placeholder images from:
- https://via.placeholder.com/800x600.jpg
- https://picsum.photos/800/600

Or create 1x1 pixel test images:
```bash
# Create test images (Linux/Mac)
convert -size 800x600 xc:blue tests/fixtures/car-1.jpg
convert -size 800x600 xc:red tests/fixtures/car-2.jpg
# etc...

# Or use ImageMagick
for i in {1..6}; do
  convert -size 800x600 "xc:#$(openssl rand -hex 3)" "tests/fixtures/car-${i}.jpg"
done
```

## For CI/CD:

The E2E tests will skip file upload tests if fixtures don't exist, so tests won't fail in CI environments.
