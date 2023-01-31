import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import { yaml as legacyYaml } from "@codemirror/legacy-modes/mode/yaml";

export const YamlLanguage = StreamLanguage.define(legacyYaml);
export function Yaml() {
  return new LanguageSupport(YamlLanguage);
}
