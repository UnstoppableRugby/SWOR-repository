#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SWOR Project Export Script
# ═══════════════════════════════════════════════════════════════
# Run this script from the project root to create a deployable ZIP.
#
# Usage:
#   chmod +x export.sh
#   ./export.sh
#
# Output: swor-export.zip in the current directory
# ═══════════════════════════════════════════════════════════════

set -e

echo "╔═══════════════════════════════════════════════╗"
echo "║   SWOR Project Export                         ║"
echo "║   Small World of Rugby — Production Export    ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Define output filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT="swor-export-${TIMESTAMP}.zip"

# Check we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found. Run this script from the SWOR project root."
    exit 1
fi

if [ ! -d "src" ]; then
    echo "ERROR: src/ directory not found. Run this script from the SWOR project root."
    exit 1
fi

echo "→ Creating export archive: ${OUTPUT}"
echo ""

# Create ZIP excluding node_modules, dist, and other build artifacts
zip -r "${OUTPUT}" \
    . \
    -x "node_modules/*" \
    -x "dist/*" \
    -x ".git/*" \
    -x ".env" \
    -x "*.zip" \
    -x ".DS_Store" \
    -x "Thumbs.db"

echo ""
echo "✓ Export complete: ${OUTPUT}"
echo ""

# Show file count and size
FILE_COUNT=$(unzip -l "${OUTPUT}" | tail -1 | awk '{print $2}')
FILE_SIZE=$(ls -lh "${OUTPUT}" | awk '{print $5}')
echo "  Files: ${FILE_COUNT}"
echo "  Size:  ${FILE_SIZE}"
echo ""
echo "═══════════════════════════════════════════════════"
echo "NEXT STEPS:"
echo "═══════════════════════════════════════════════════"
echo ""
echo "1. Download ${OUTPUT} to your local machine"
echo ""
echo "2. Unzip and push to GitHub:"
echo "   unzip ${OUTPUT} -d swor-project"
echo "   cd swor-project"
echo "   git init"
echo "   git remote add origin https://github.com/UnstoppableRugby/SWOR-repository.git"
echo "   git add ."
echo "   git commit -m 'SWOR production release — $(date +%Y-%m-%d)'"
echo "   git branch -M main"
echo "   git push -u origin main --force"
echo ""
echo "3. Deploy on Vercel:"
echo "   - Import UnstoppableRugby/SWOR-repository"
echo "   - Framework: Vite | Build: npm run build | Output: dist"
echo "   - Set env vars: VITE_database_URL + VITE_database_ANON_KEY"
echo "   - Add domain: swor.rugby"
echo ""
echo "See DEPLOYMENT.md for full instructions."
echo "═══════════════════════════════════════════════════"
