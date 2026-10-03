import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import { ExpoPlugin } from '@callstack/repack-expo/rspack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';
import { getSharedDependencies } from 'super-app-showcase-sdk';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9001;

export default (env) => {
  const {
    mode = 'development',
    platform = process.env.PLATFORM,
    devServer,
  } = env;

  if (platform !== 'ios' && platform !== 'android') {
    throw new Error('trading requires PLATFORM=ios or PLATFORM=android');
  }

  // Every chunk of a mini app is a remote chunk served next to its manifest.
  const remoteOutputPath = path.join(projectRoot, 'build', 'remote', platform);

  return {
    context: projectRoot,
    devServer,
    mode,
    name: platform,
    module: {
      rules: [
        {
          // ExpoPlugin keeps ES modules for Babel, so Rspack applies Node's
          // fully-specified ESM resolution to `"type": "module"` packages.
          // React Native libraries (e.g. React Navigation) use extensionless
          // imports that rely on platform extensions.
          test: /\.m?js$/,
          resolve: { fullySpecified: false },
        },
        ...Repack.getAssetTransformRules({ inline: true }),
      ],
    },
    output: {
      clean: true,
      path: path.join(projectRoot, 'build', 'rspack', platform),
      publicPath: `http://localhost:${PORT}/${platform}/`,
      uniqueName: 'sas-trading',
    },
    plugins: [
      new ReanimatedPlugin({ unstable_disableTransform: true }),
      new ExpoPlugin({
        platform,
        repack: {
          extraChunks: [
            { include: /.*/, type: 'remote', outputPath: remoteOutputPath },
          ],
        },
      }),
      new Repack.plugins.ModuleFederationPluginV2({
        name: 'trading',
        filename: 'trading.container.js.bundle',
        dts: false,
        exposes: {
          "./App": "./src/navigation/MainNavigator"
        },
        shared: getSharedDependencies({ eager: false, projectRoot }),
      }),
    ],
  };
};
