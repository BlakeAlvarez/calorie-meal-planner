#!/bin/bash
# Deploys built frontend to /var/www/mealpreptool on local server
# Use: npm run deploy

set -e

# go up a directory to get build files properly
cd "$(dirname "$0")/.."


echo "Building Vite app..."
npm run build -- --mode production || exit 1


echo "Cleaning old deployment..."
sudo rm -rf /var/www/mealpreptool
sudo mkdir -p /var/www/mealpreptool


echo "Copying new build to /var/www/mealpreptool..."
sudo cp -r dist/* /var/www/mealpreptool/


echo "Reloading NGINX..."
sudo systemctl reload nginx

echo "Deploy complete: https://blakealvarez.com/mealpreptool/"
