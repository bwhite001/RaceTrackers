.DEFAULT_GOAL := help
.PHONY: help install dev build preview test test-run test-coverage test-watch \
        test-unit test-base test-db test-integration test-services test-components \
        test-e2e test-e2e-ci test-changed seed seed-minimal clear-data clean

# ─── Local Development ────────────────────────────────────────────────────────

install: ## Install dependencies
	npm install

dev: ## Start dev server (http://localhost:3000)
	npm run dev

build: ## Production build
	npm run build

preview: build ## Build then serve locally (http://localhost:4173)
	npm run preview

# ─── Testing ──────────────────────────────────────────────────────────────────

test: ## Run tests in watch mode
	npm test

test-run: ## Run all tests once
	npm run test:run

test-coverage: ## Run tests with coverage report
	npm run test:coverage

test-watch: ## Run tests in watch mode (alias)
	npm run test:watch

test-unit: ## Unit tests
	npm run test:suite:unit

test-base: ## Base station tests
	npm run test:suite:base-operations

test-db: ## Database tests
	npm run test:suite:database

test-integration: ## Integration tests
	npm run test:suite:integration

test-services: ## Service layer tests
	npm run test:suite:services

test-components: ## Component tests
	npm run test:suite:components

test-e2e: build ## E2E tests (builds first)
	npm run test:e2e

test-e2e-ci: build ## E2E tests headless (builds first)
	npm run test:e2e:ci

test-changed: ## Run only tests affected by uncommitted changes
	npm run test:changed

# ─── Test Data ────────────────────────────────────────────────────────────────

seed: ## Seed full test dataset into IndexedDB
	npm run test:seed

seed-minimal: ## Seed minimal test dataset
	npm run test:seed:minimal

clear-data: ## Clear all test data from IndexedDB
	npm run test:clear

# ─── Docs ─────────────────────────────────────────────────────────────────────

guide-pdfs: ## Generate PDFs from user guide (one per journey section)
	npm run generate:guide:pdfs

# ─── Housekeeping ─────────────────────────────────────────────────────────────

clean: ## Remove build artifacts
	rm -rf dist dev-dist

# ─── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
