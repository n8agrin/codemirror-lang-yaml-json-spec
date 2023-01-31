// import { parser } from "./syntax.grammar";
import {
  LRLanguage,
  LanguageSupport,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  delimitedIndent,
  Language,
  defineLanguageFacet,
  StreamLanguage,
} from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
import { Input, Parser, PartialParse, TreeFragment } from "@lezer/common";
import { yaml as legacyYaml } from "@codemirror/legacy-modes/mode/yaml";

class Nonsense implements PartialParse {
  advance() {
    return null;
  }
  get parsedPos() {
    return 0;
  }
  stopAt(pos: number): void {}
  get stoppedAt() {
    return 0;
  }
}

class DemoLang extends Parser {
  createParse(
    input: Input,
    fragments: readonly TreeFragment[],
    ranges: readonly { from: number; to: number }[]
  ): PartialParse {
    console.log(input, fragments, ranges);
    return new Nonsense();
  }
}

// export const YamlLanguage = LRLanguage.define({
//   parser: parser.configure({
//     props: [
//       indentNodeProp.add({
//         Application: delimitedIndent({ closing: ")", align: false }),
//       }),
//       foldNodeProp.add({
//         Application: foldInside,
//       }),
//       styleTags({
//         Identifier: t.variableName,
//         Boolean: t.bool,
//         String: t.string,
//         LineComment: t.lineComment,
//         "( )": t.paren,
//       }),
//     ],
//   }),
//   languageData: {
//     commentTokens: { line: ";" },
//   },
// });

// const parser = new DemoLang();
// const data = defineLanguageFacet({ block: { open: "<!--", close: "-->" } });
// export const YamlLanguage = new Language(data, parser, [], "yaml");

export const YamlLanguage = StreamLanguage.define(legacyYaml);
export function Yaml() {
  return new LanguageSupport(YamlLanguage);
}
