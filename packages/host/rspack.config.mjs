import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import { ExpoPlugin } from '@callstack/repack-expo/rspack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';
import { getSharedDependencies } from 'super-app-showcase-sdk';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Mini apps and the dev server port each one runs on.
const MINI_APPS = { auth: 9003, trading: 9001, wallet: 9002 };

export default (env) => {
  const {
    entry,
    mode = 'development',
    platform = process.env.PLATFORM,
    devServer,
  } = env;

  if (platform !== 'ios' && platform !== 'android') {
    throw new Error('ExpoPlugin requires PLATFORM=ios or android');
  }

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
      ],
    },
    output: {
      clean: true,
      path: path.join(projectRoot, 'build', 'rspack', platform),
      uniqueName: 'sas-host',
    },
    plugins: [
      new ReanimatedPlugin({ unstable_disableTransform: true }),
      new ExpoPlugin({ entry, platform }),
      new Repack.plugins.ModuleFederationPluginV2({
        name: 'host',
        dts: false,
        remotes: Object.fromEntries(
          Object.entries(MINI_APPS).map(([name, port]) => [
            name,
            `${name}@http://localhost:${port}/${platform}/mf-manifest.json`,
          ])
        ),
        shared: getSharedDependencies({ eager: true, projectRoot }),
      }),
    ],
  };
};
