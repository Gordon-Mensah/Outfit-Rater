#!/bin/bash
# AUTO-FIX SCRIPT for Vibe-Coded Patterns
# Run this in your project root directory

echo "🚀 Starting Vibe-Code Pattern Fixes..."
echo ""

# Colors for output
GREEN='\033[0.32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup original files
echo "📦 Creating backups..."
mkdir -p backups
cp src/*.css backups/ 2>/dev/null
cp src/*.jsx backups/ 2>/dev/null
echo "✅ Backups created in ./backups/"
echo ""

# Fix 1: Border Radius
echo "🔧 Fixing border-radius values..."
find src -type f \( -name "*.css" -o -name "*.jsx" \) -exec sed -i.bak \
  -e 's/border-radius: 6px;/border-radius: var(--radius-sm);/g' \
  -e 's/border-radius: 8px;/border-radius: var(--radius-sm);/g' \
  -e 's/border-radius: 10px;/border-radius: var(--radius-md);/g' \
  -e 's/border-radius: 12px;/border-radius: var(--radius-md);/g' \
  -e 's/border-radius: 14px;/border-radius: var(--radius-md);/g' \
  -e 's/border-radius: 16px;/border-radius: var(--radius-lg);/g' \
  -e 's/border-radius: 18px;/border-radius: var(--radius-lg);/g' \
  -e 's/border-radius: 20px;/border-radius: var(--radius-lg);/g' \
  -e 's/border-radius: 24px;/border-radius: var(--radius-lg);/g' \
  -e 's/border-radius: 25px;/border-radius: var(--radius-lg);/g' \
  -e 's/border-radius: 30px;/border-radius: var(--radius-lg);/g' \
  {} \;
echo "✅ Border-radius fixed"

# Fix 2: Purple Gradients
echo "🔧 Fixing purple gradients..."
find src -type f -name "*.css" -exec sed -i.bak \
  -e 's/linear-gradient(135deg, #667eea, #764ba2)/var(--gradient-brand)/g' \
  -e 's/linear-gradient(135deg, var(--primary-purple), var(--secondary-purple))/var(--gradient-brand)/g' \
  {} \;
echo "✅ Gradients fixed"

# Fix 3: Hover Effects
echo "🔧 Fixing hover transforms..."
find src -type f -name "*.css" -exec sed -i.bak \
  -e 's/transform: translateY(-2px);/transform: translateY(var(--lift-subtle));/g' \
  -e 's/transform: translateY(-4px);/transform: translateY(var(--lift-subtle));/g' \
  -e 's/transform: translateY(-5px);/transform: translateY(var(--lift-subtle));/g' \
  -e 's/transform: translateY(-8px);/transform: translateY(var(--lift-subtle));/g' \
  {} \;
echo "✅ Hover effects fixed"

# Fix 4: Transitions
echo "🔧 Fixing transitions..."
find src -type f -name "*.css" -exec sed -i.bak \
  -e 's/transition: all 0\.3s ease;/transition: transform var(--transition-base), box-shadow var(--transition-base);/g' \
  -e 's/transition: all 0\.2s ease;/transition: transform var(--transition-fast), box-shadow var(--transition-fast);/g' \
  -e 's/transition: 0\.3s ease;/transition: var(--transition-base);/g' \
  -e 's/transition: 0\.2s ease;/transition: var(--transition-fast);/g' \
  {} \;
echo "✅ Transitions fixed"

# Fix 5: Remove emojis from JSX headings (manual patterns)
echo "🔧 Removing emojis from headings..."
find src -type f -name "*.jsx" -exec sed -i.bak \
  -e 's/<h1>🎨/<h1>/g' \
  -e 's/<h2>✨/<h2>/g' \
  -e 's/<h3>🔥/<h3>/g' \
  -e 's/<h1>💬/<h1>/g' \
  -e 's/<h2>🎯/<h2>/g' \
  -e 's/<h3>🌱/<h3>/g' \
  -e 's/<h1>🎨 /<h1>/g' \
  -e 's/<h2>✨ /<h2>/g' \
  -e 's/<h3>🔥 /<h3>/g' \
  -e 's/<h1>💬 /<h1>/g' \
  -e 's/<h2>🎯 /<h2>/g' \
  -e 's/<h3>🌱 /<h3>/g' \
  {} \;
echo "✅ Emojis removed from headings"

# Clean up .bak files
echo "🧹 Cleaning up..."
find src -type f -name "*.bak" -delete
echo "✅ Cleanup complete"

echo ""
echo "✨ All fixes applied successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review changes in your code editor"
echo "2. Test your application thoroughly"
echo "3. If needed, restore from ./backups/"
echo ""
echo "💡 Don't forget to:"
echo "  - Add design-tokens.css to your project"
echo "  - Import it at the top of index.css"
echo "  - Manually review large CSS files"
echo ""