# DiagnosticPro AI Platform - Development Makefile
# This file enforces development best practices and safety checks

.PHONY: help install lint-check test type-check format format-check build clean pre-commit-install safe-commit full-check dev

# Default target - show help
help:
	@echo "DiagnosticPro Development Commands:"
	@echo ""
	@echo "  make install          - Install all dependencies and set up development environment"
	@echo "  make dev             - Start development server"
	@echo "  make lint-check      - Run ESLint checks"
	@echo "  make type-check      - Run TypeScript type checking"
	@echo "  make format          - Auto-format code with Prettier"
	@echo "  make format-check    - Check code formatting"
	@echo "  make test            - Run all tests"
	@echo "  make build           - Build for production"
	@echo "  make full-check      - Run ALL checks (lint, type, format, test)"
	@echo "  make safe-commit     - Run all checks before committing"
	@echo "  make pre-commit-install - Install git pre-commit hooks"
	@echo "  make clean           - Clean build artifacts and node_modules"
	@echo ""
	@echo "CRITICAL: Always run 'make safe-commit' before committing!"

# Install dependencies and set up development environment
install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "🔧 Installing pre-commit hooks..."
	@make pre-commit-install
	@echo "✅ Installation complete!"

# Start development server
dev:
	@echo "🚀 Starting development server..."
	npm run dev

# Run ESLint
lint-check:
	@echo "🔍 Running ESLint checks..."
	npm run lint
	@echo "✅ Lint checks passed!"

# Run TypeScript type checking
type-check:
	@echo "📝 Running TypeScript type checks..."
	npx tsc --noEmit
	@echo "✅ Type checks passed!"

# Format code with Prettier
format:
	@echo "🎨 Formatting code with Prettier..."
	npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
	@echo "✅ Code formatted!"

# Check code formatting
format-check:
	@echo "🎨 Checking code formatting..."
	npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"
	@echo "✅ Format checks passed!"

# Run tests
test:
	@echo "🧪 Running tests..."
	@if [ -f "package.json" ] && grep -q '"test"' package.json; then \
		npm test -- --passWithNoTests; \
	else \
		echo "⚠️  No test script found. Skipping tests."; \
	fi
	@echo "✅ Tests completed!"

# Build for production
build:
	@echo "🏗️  Building for production..."
	npm run build
	@echo "✅ Build successful!"

# Run ALL checks
full-check: lint-check type-check format-check test
	@echo "✅ All checks passed successfully!"

# Install git hooks
install-hooks:
	@echo "🔧 Installing git hooks..."
	@chmod +x install-hooks.sh
	@./install-hooks.sh

pre-commit-install: install-hooks

# Safe commit - run all checks before allowing commit
safe-commit:
	@echo "🔒 Running safety checks before commit..."
	@make full-check
	@echo "✅ All checks passed! Safe to commit."
	@echo "📝 Next steps:"
	@echo "  1. git add ."
	@echo "  2. git commit -m 'type: descriptive message'"
	@echo "  3. git push origin feature/branch-name"

# Create feature branch
create-branch:
	@read -p "Enter feature name: " feature_name; \
	git checkout -b feature/$$feature_name; \
	echo "✅ Created and switched to branch: feature/$$feature_name"

# Complete workflow helper
workflow-start:
	@echo "🚀 Starting development workflow..."
	@make create-branch
	@make install-hooks
	@echo "🎉 Ready for development!"

# Check git status and branch
git-status:
	@echo "📊 Git Status:"
	@git status --short
	@echo ""
	@echo "📍 Current Branch: $$(git rev-parse --abbrev-ref HEAD)"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist node_modules package-lock.json
	@echo "✅ Clean complete!"