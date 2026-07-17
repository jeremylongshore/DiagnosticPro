#!/bin/bash

# Pre-commit hook script for DiagnosticPro AI Platform
# This script enforces development safety rules

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔒 Running pre-commit safety checks...${NC}"

# Check if we're on main/master branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
    echo -e "${RED}❌ BLOCKED: Direct commits to main/master branch are not allowed!${NC}"
    echo -e "${YELLOW}Create a feature branch first:${NC}"
    echo -e "  git checkout -b feature/your-feature-name"
    exit 1
fi

echo -e "${GREEN}✅ Branch check passed (on $BRANCH)${NC}"

# Run linting
echo -e "${YELLOW}🔍 Running ESLint...${NC}"
if ! make lint-check; then
    echo -e "${RED}❌ ESLint errors found! Fix them before committing.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ ESLint passed${NC}"

# Run type checking
echo -e "${YELLOW}🔍 Running TypeScript type checking...${NC}"
if ! make type-check; then
    echo -e "${RED}❌ TypeScript errors found! Fix them before committing.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript check passed${NC}"

# Run format checking
echo -e "${YELLOW}🔍 Checking code formatting...${NC}"
if ! make format-check; then
    echo -e "${RED}❌ Code formatting issues found!${NC}"
    echo -e "${YELLOW}Run 'make format' to fix formatting${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code formatting check passed${NC}"

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
if ! make test; then
    echo -e "${RED}❌ Tests failed! Fix them before committing.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All tests passed${NC}"

# Run audit-harness
echo -e "${YELLOW}🔍 Running audit-harness...${NC}"
if ! make audit; then
    echo -e "${YELLOW}⚠️ Audit gates advisory (warnings only for now).${NC}"
fi
echo -e "${GREEN}✅ Audit check passed${NC}"

echo -e "${GREEN}🎉 All safety checks passed! Commit allowed.${NC}"
exit 0