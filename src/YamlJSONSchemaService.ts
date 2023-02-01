import type { CompletionResult } from "@codemirror/autocomplete";
import { Diagnostic as CodeMirrorDiagnostic } from "@codemirror/lint";
import { Connection } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  DiagnosticSeverity,
  LanguageService,
  LanguageSettings,
  uinteger,
  WorkspaceContextService,
} from "yaml-language-server";
import { Telemetry } from "yaml-language-server/lib/esm/languageservice/telemetry";
import { getLanguageService } from "yaml-language-server/lib/esm/languageservice/yamlLanguageService.js";
import { SettingsState } from "yaml-language-server/lib/esm/yamlSettings";

/**
 * Handles the work of connecting to a VS Code style language server for YAML.
 *
 * Converts from the Monaco-typed resposes for Completions, Diagnostics, etc to the CodeMirror equivalents
 */
export class YamlJSONSchemaService {
  private yamlLangService: LanguageService;
  private docVersions: { [key: string]: number } = {};

  constructor() {
    this.yamlLangService = getLanguageService(
      schemaRequestService,
      (null as unknown) as WorkspaceContextService,
      (null as unknown) as Connection,
      (null as unknown) as Telemetry,
      (null as unknown) as SettingsState
    );
    this.config();
  }

  config(options: LanguageSettings = {}) {
    this.yamlLangService.configure({ ...defaultLanguageSettings, ...options });
  }

  async validate(props: {
    uri: string;
    content: string;
  }): Promise<CodeMirrorDiagnostic[]> {
    const { uri, content } = props;
    const doc = this.getTextDocumentFromUriAndContent(uri, content);
    return (await this.yamlLangService.doValidation(doc, false)).map(
      (diagnostic) => ({
        from: doc.offsetAt(diagnostic.range.start),
        to: doc.offsetAt(diagnostic.range.end),
        severity: diagnostic.severity
          ? MonacoDiagnosticSeverityToCodeMirrorSeverityMap[diagnostic.severity]
          : "info",
        message: diagnostic.message,
      })
    );
  }

  async complete(props: {
    uri: string;
    content: string;
    from: uinteger;
    to: uinteger;
  }) {
    const { uri, content, from, to } = props;
    const doc = this.getTextDocumentFromUriAndContent(uri, content);
    const position = doc.positionAt(from);
    const completions = await this.yamlLangService.doComplete(
      doc,
      position,
      false
    );

    let cmCompletions: CompletionResult | null = null;
    if (completions?.items.length) {
      cmCompletions = {
        from,
        to,
        options: completions.items.map((completion) => ({
          label: completion.label,
          type: "text",
        })),
      };
    }
    return cmCompletions;
  }

  /**
   * Given some URI and content, return a TextDocument
   *
   * TextDocuments contain a version number. yaml-language-server builds on the Monaco assumption that
   * each change to a TextDocument will increment its version, and caches each TextDocument it is passed.
   * We work around that here to simply increment on each call, ensuring yaml-language-server always
   * parses and validates documents.
   *
   * TODO: combine URI + content into some kind of hash to index on the version number to leverage
   * yaml-language-server's internal caching
   *
   * @param uri
   * @param content
   * @returns
   */
  private getTextDocumentFromUriAndContent(uri: string, content: string) {
    const version =
      this.docVersions[uri] !== undefined
        ? ++this.docVersions[uri]
        : (this.docVersions[uri] = 0);
    return TextDocument.create(uri, "yaml", version, content);
  }
}

async function schemaRequestService(uri: string): Promise<string> {
  const response = await fetch(uri);
  if (response.ok) {
    return response.text();
  }
  throw new Error(`Schema request failed for ${uri}`);
}

const defaultLanguageSettings: LanguageSettings = {
  completion: true,
  customTags: [],
  format: true,
  isKubernetes: false,
  hover: true,
  schemas: [],
  validate: true,
  yamlVersion: "1.2",
};

const MonacoDiagnosticSeverityToCodeMirrorSeverityMap: {
  [Key in DiagnosticSeverity]: CodeMirrorDiagnostic["severity"];
} = {
  [DiagnosticSeverity.Error]: "error",
  [DiagnosticSeverity.Warning]: "warning",
  [DiagnosticSeverity.Information]: "info",
  [DiagnosticSeverity.Hint]: "info",
};
