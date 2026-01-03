#!/usr/bin/env node

/**
 * Copy configuration files from src/config to dist/config
 * This script is run as part of the build process to ensure
 * JSON configuration files are available at runtime.
 */

const fs = require('fs');
const path = require('path');

const SRC_CONFIG_DIR = path.join(__dirname, '../src/config');
const DEST_CONFIG_DIR = path.join(__dirname, '../dist/config');

try {
  // Ensure source directory exists
  if (!fs.existsSync(SRC_CONFIG_DIR)) {
    console.error(`Error: Source config directory not found: ${SRC_CONFIG_DIR}`);
    process.exit(1);
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(DEST_CONFIG_DIR)) {
    fs.mkdirSync(DEST_CONFIG_DIR, { recursive: true });
    console.log(`Created directory: ${DEST_CONFIG_DIR}`);
  }

  // Read all files in source config directory
  const files = fs.readdirSync(SRC_CONFIG_DIR);
  const jsonFiles = files.filter(file => file.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.log('No JSON files found in src/config');
    process.exit(0);
  }

  // Copy each JSON file
  let copiedCount = 0;
  jsonFiles.forEach(file => {
    const srcPath = path.join(SRC_CONFIG_DIR, file);
    const destPath = path.join(DEST_CONFIG_DIR, file);
    
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${file}`);
      copiedCount++;
    } catch (err) {
      console.error(`Error copying ${file}:`, err.message);
    }
  });

  console.log(`Successfully copied ${copiedCount} configuration file(s)`);
  process.exit(0);
} catch (error) {
  console.error('Error during config file copy:', error.message);
  process.exit(1);
}
