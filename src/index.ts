import { LanguageSupport, StreamLanguage } from "@codemirror/language";
import { yaml as legacyYaml } from "@codemirror/legacy-modes/mode/yaml";

export const YamlLanguage = StreamLanguage.define(legacyYaml);
export const Yaml = () => new LanguageSupport(YamlLanguage);
// export { YamlJSONSchemaService } from "./YamlJSONSchemaService";
