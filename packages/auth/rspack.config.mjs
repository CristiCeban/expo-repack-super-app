import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import { ExpoPlugin } from '@callstack/repack-expo/rspack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';
import { getSharedDependencies } from 'super-app-showcase-sdk';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9003;

export default (env) => {
  const {
    mode = 'development',
    platform = process.env.PLATFORM,
    devServer,
  } = env;

  if (platform !== 'ios' && platform !== 'android') {
    throw new Error('auth requires PLATFORM=ios or PLATFORM=android');
  }

  // Every chunk of a mini app is a remote chunk served next to its manifest.
  const remoteOutputPath = path.join(projectRoot, 'build', 'remote', platform);

  return {
    context: projectRoot,
    devServer,
    mode,
    name: platform,
    module: {
      rules: Repack.getAssetTransformRules({ inline: true }),
    },
    output: {
      clean: true,
      path: path.join(projectRoot, 'build', 'rspack', platform),
      publicPath: `http://localhost:${PORT}/${platform}/`,
      uniqueName: 'sas-auth',
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
        name: 'auth',
        filename: 'auth.container.js.bundle',
        dts: false,
        exposes: {
          "./AccountScreen": "./src/screens/AccountScreen",
          "./SignInScreen": "./src/screens/SignInScreen",
          "./AuthProvider": "./src/providers/AuthProvider"
        },
        shared: getSharedDependencies({ eager: false, projectRoot }),
      }),
    ],
  };
};
