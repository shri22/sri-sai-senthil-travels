#!/bin/bash
set -e

echo "Installing .NET 9.0 SDK on Ubuntu..."

# Download Microsoft package repository
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Update package list
apt-get update

# Install .NET SDK 9.0
apt-get install -y dotnet-sdk-9.0

# Verify installation
dotnet --version

echo "✅ .NET 9.0 SDK installed successfully!"
