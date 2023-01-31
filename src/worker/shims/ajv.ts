/**
 * Imported from the monaco-yaml project:
 * https://github.com/remcohaszing/monaco-yaml
 *
 * Licensed under the MIT license scheme inherited from monaco-yaml and copied
 * into the MONACO_YAML_LICENSE.md file in this directory.
 */
import type { ValidateFunction } from "ajv";

export default class AJVStub {
  compile(): ValidateFunction {
    return ((() => true) as unknown) as ValidateFunction;
  }
}
