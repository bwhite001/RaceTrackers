.DEFAULT_GOAL := help
.PHONY: help install dev build preview test test-run test-coverage test-watch \
        test-unit test-base test-db test-integration test-services test-components \
        test-e2e test-e2e-ci test-confidence test-changed seed seed-minimal clear-data clean

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

test-confidence: build ## Full-confidence E2E check across all 3 operator roles
	npx playwright test test/e2e/playwright/00-full-confidence.journey.spec.js

test-changed: ## Run only tests affected by uncommitted changes
	npm run test:changed

# ─── Test Data ────────────────────────────────────────────────────────────────

dev-fixtures: ## Copy sample XLSX fixtures to public/import/ for the dev file picker
	mkdir -p public/import && cp import/*.xlsx public/import/

seed: ## Seed full test dataset into IndexedDB
	npm run test:seed

seed-minimal: ## Seed minimal test dataset
	npm run test:seed:minimal

clear-data: ## Clear all test data from IndexedDB
	npm run test:clear

# ─── Docs ─────────────────────────────────────────────────────────────────────

guide: ## Regenerate user guide + annotated journey docs from latest test run
	npm run generate:guide && npm run generate:journeys

generate-journeys: ## Generate annotated role journey docs (requires a prior test-e2e run)
	npm run generate:journeys

guide-pdfs: ## Generate PDFs from user guide (one per journey section)
	npm run generate:guide:pdfs

journey-pdfs: ## Generate PDFs from annotated role journey docs
	npm run generate:journey:pdfs

generate-gpx-guide: ## Generate AllTrails GPX extraction guide (HTML + PDF) from scripts/gpx-guide-config.json
	npm run generate:gpx-guide

# ─── Housekeeping ─────────────────────────────────────────────────────────────

clean: ## Remove build artifacts
	rm -rf dist dev-dist

# ─── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
