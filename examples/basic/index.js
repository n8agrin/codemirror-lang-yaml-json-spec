import { EditorView, basicSetup } from "codemirror";
import { Yaml } from "codemirror-lang-yaml";

new EditorView({
  extensions: [basicSetup, Yaml()],
  parent: document.body,
});
