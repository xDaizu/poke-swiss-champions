#!/bin/bash

# Install required test dependencies if not present
echo "Installing test dependencies..."
npm install --no-save @testing-library/react @testing-library/jest-dom jest ts-jest jest-environment-jsdom

# Run the clipboard feature tests
echo "Running clipboard backup tests..."
npx jest --config=jest.config.js src/components/ui/__tests__/clipboard-backup.test.tsx

echo "Running BackupManager tests..."
npx jest --config=jest.config.js src/components/ui/__tests__/BackupManager.test.tsx

echo "Running ClipboardRestoreDialog tests..."
npx jest --config=jest.config.js src/components/ui/__tests__/ClipboardRestoreDialog.test.tsx

# Run with coverage report
echo "Generating test coverage report..."
npx jest --config=jest.config.js --coverage src/components/ui/__tests__/clipboard-backup.test.tsx 