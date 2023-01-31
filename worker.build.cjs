const { build } = require("esbuild");
const alias = require("esbuild-plugin-alias");
const url = require("url");

const compileWorker = async () => {
  await build({
    format: "esm",
    target: ["es2019"],
    entryPoints: ["src/worker/worker.ts"],
    bundle: true,
    mainFields: ["module", "main"],
    logLevel: "info",
    outdir: "./dist/worker",
    sourcemap: true,
    plugins: [
      alias({
        path: require.resolve("path-browserify"),
        prettier: require.resolve("prettier/standalone.js"),
      }),
      {
        name: "alias2",
        setup({ onResolve, resolve }) {
          // The file monaco-yaml/lib/esm/schemaSelectionHandlers.js imports code from the language
          // server part that we don’t want.
          onResolve({ filter: /\/schemaSelectionHandlers$/ }, () => ({
            path: url.fileURLToPath(
              new URL(
                "src/worker/shims/schemaSelectionHandlers.ts",
                url.pathToFileURL(__filename)
              )
            ),
          }));
          // The yaml language service only imports re-exports of vscode-languageserver-types from
          // vscode-languageserver.
          onResolve(
            { filter: /^vscode-languageserver(\/node|-protocol)?$/ },
            () => ({
              path: "vscode-languageserver-types",
              external: true,
              sideEffects: false,
            })
          );
          // Ajv would significantly increase bundle size.
          onResolve({ filter: /^ajv$/ }, () => ({
            path: url.fileURLToPath(
              new URL("src/worker/shims/ajv.ts", url.pathToFileURL(__filename))
            ),
          }));
          // This tiny filler implementation serves all our needs.
          onResolve({ filter: /vscode-nls/ }, () => ({
            path: url.fileURLToPath(
              new URL(
                "src/worker/shims/vscode-nls.ts",
                url.pathToFileURL(__filename)
              )
            ),
            sideEffects: false,
          }));
          // The language server dependencies tend to write both ESM and UMD output alongside each
          // other, then use UMD for imports. We prefer ESM.
          onResolve({ filter: /\/umd\// }, ({ path, ...options }) =>
            resolve(path.replace(/\/umd\//, "/esm/"), options)
          );
          onResolve({ filter: /.*/ }, () => ({ sideEffects: false }));
        },
      },
    ],
  });
};

compileWorker();
