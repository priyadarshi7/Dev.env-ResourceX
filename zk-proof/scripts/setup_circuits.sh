#!/bin/bash
set -e

echo "Setting up ZK circuit..."

# Install circom if not installed
if ! command -v circom &> /dev/null; then
    echo "Installing circom..."
    npm install -g circomlib
    npm install -g snarkjs
fi

# Create circuits directory
mkdir -p circuits

echo "Circuit setup complete!"