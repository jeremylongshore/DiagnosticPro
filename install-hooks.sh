#!/bin/bash

# Install git hooks for DiagnosticPro AI Platform

set -e

echo "🔧 Installing git hooks..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy pre-commit hook
cp pre-commit-hooks.sh .git/hooks/pre-commit

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "🔒 Safety features now active:"
echo "  - Prevents direct commits to main/master"
echo "  - Runs lint, type, format, and test checks"
echo "  - Enforces code quality standards"
echo ""
echo "📝 To commit safely, always use: make safe-commit"