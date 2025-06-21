const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js core modules for Supabase compatibility
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve('stream-browserify'),
  util: require.resolve('util/'),
  buffer: require.resolve('buffer/'),
  crypto: require.resolve('crypto-browserify'),
};

module.exports = config; 