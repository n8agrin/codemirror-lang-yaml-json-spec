/**
 * Imported from the monaco-yaml project:
 * https://github.com/remcohaszing/monaco-yaml
 *
 * Licensed under the MIT license scheme inherited from monaco-yaml and copied
 * into the MONACO_YAML_LICENSE.md file in this directory.
 */

export interface Options {
  locale?: string;
  cacheLanguageResolution?: boolean;
}
export interface LocalizeInfo {
  key: string;
  comment: string[];
}
export type LocalizeFunc = (
  info: LocalizeInfo | string,
  message: string,
  ...args: string[]
) => string;
export type LoadFunc = (file?: string) => LocalizeFunc;

function format(message: string, args: string[]): string {
  return args.length === 0
    ? message
    : message.replace(/{(\d+)}/g, (match, rest: number[]) => {
        const [index] = rest;
        return typeof args[index] === "undefined" ? match : args[index];
      });
}

function localize(
  _: LocalizeInfo | string,
  message: string,
  ...args: string[]
): string {
  return format(message, args);
}

export function loadMessageBundle(): LocalizeFunc {
  return localize;
}

export function config(): LoadFunc {
  return loadMessageBundle;
}
