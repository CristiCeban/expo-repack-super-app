const fs = require('node:fs');
const path = require('node:path');

/**
 * Packages shared as Module Federation singletons between the host and the
 * mini apps. Every native module here must be linked in the host binary.
 */
const SHARED_DEPENDENCIES = [
  'react',
  'react-native',
  'expo',
  'expo-asset',
  'expo-constants',
  'expo-font',
  '@expo/vector-icons',
  '@react-native-async-storage/async-storage',
  '@react-navigation/native',
  '@react-navigation/native-stack',
  '@bottom-tabs/react-navigation',
  'react-native-bottom-tabs',
  'react-native-paper',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-worklets',
  '@shopify/react-native-skia',
  'victory-native',
  '@gorhom/bottom-sheet',
  'super-app-showcase-sdk',
];

/**
 * Read a package's installed version from `node_modules`, walking up from
 * `projectRoot`. Not every package exports `./package.json`, so this avoids
 * `require.resolve('<name>/package.json')`.
 */
const getInstalledVersion = (name, projectRoot) => {
  for (let dir = projectRoot; ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, 'node_modules', name, 'package.json');
    if (fs.existsSync(manifest)) {
      return JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
    }
    if (dir === path.dirname(dir)) {
      throw new Error(`Cannot find ${name} installed for ${projectRoot}`);
    }
  }
};

/**
 * Build the Module Federation `shared` config. Versions are read from the
 * packages installed in `projectRoot`, which all come from the workspace
 * catalog, so the host and every mini app agree on them.
 *
 * @param {{ eager: boolean, projectRoot: string }} options Use `eager: false` in mini apps.
 */
const getSharedDependencies = ({ eager, projectRoot }) =>
  Object.fromEntries(
    SHARED_DEPENDENCIES.map((name) => {
      const version = getInstalledVersion(name, projectRoot);
      return [
        name,
        { singleton: true, eager, version, requiredVersion: version },
      ];
    })
  );

module.exports = { getSharedDependencies, SHARED_DEPENDENCIES };
