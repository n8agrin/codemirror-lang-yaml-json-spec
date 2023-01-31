import type { CompletionResult } from "@codemirror/autocomplete";
import type { Diagnostic } from "@codemirror/lint";
import invariant from "tiny-invariant";
import { TextDocument } from "vscode-languageserver-textdocument";
import type {
  LanguageService,
  LanguageSettings,
  uinteger,
} from "yaml-language-server";
import { getLanguageService } from "yaml-language-server/lib/esm/languageservice/yamlLanguageService.js";

export {};
declare let self: Worker;

let yamlLanguageService: LanguageService | undefined;

async function schemaRequestService(uri: string): Promise<string> {
  console.log("requesting schema");
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

export enum WORKER_MSG_TYPES {
  CONFIGURE = "configure",
  VALIDATE = "validate",
  COMPLETE = "complete",
}

const initializeLanguageServer = () => {
  yamlLanguageService = getLanguageService(
    schemaRequestService,
    null,
    null,
    null,
    null
  );
  configureLanguageServer();
};

const configureLanguageServer = (options: LanguageSettings = {}) => {
  const config = { ...defaultLanguageSettings, ...options };
  yamlLanguageService?.configure(config);
};

const documentVersions: { [key: string]: number } = {};

const getTextDocumentFromUriAndContent = (uri: string, content: string) => {
  const version =
    documentVersions[uri] !== undefined
      ? ++documentVersions[uri]
      : (documentVersions[uri] = 0);
  console.log("version", version);
  return TextDocument.create(uri, "yaml", version, content);
};

const doValidation = async (uri: string, content: string) => {
  const doc = getTextDocumentFromUriAndContent(uri, content);
  const monacoDiagnostics = await yamlLanguageService?.doValidation(doc, false);

  if (monacoDiagnostics) {
    const cmDiagnostics: Diagnostic[] = [];
    for (const monacoDiagnostic of monacoDiagnostics) {
      cmDiagnostics.push({
        from: doc.offsetAt(monacoDiagnostic.range.start),
        to: doc.offsetAt(monacoDiagnostic.range.end),
        severity: "error",
        message: monacoDiagnostic.message,
      });
    }

    self.postMessage(
      JSON.stringify({ type: WORKER_MSG_TYPES.VALIDATE, data: cmDiagnostics })
    );
  }
};

const doComplete = async (props: {
  uri: string;
  content: string;
  from: uinteger;
  to: uinteger;
}) => {
  const { uri, content, from, to } = props;
  const doc = getTextDocumentFromUriAndContent(uri, content);
  const position = doc.positionAt(from);
  const completions = await yamlLanguageService?.doComplete(
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

  self.postMessage(
    JSON.stringify({
      type: WORKER_MSG_TYPES.COMPLETE,
      data: cmCompletions,
    })
  );
};

const dispatchMessage = (msg: string) => {
  let parsedMsg;
  try {
    parsedMsg = JSON.parse(msg);
  } catch (e) {
    throw new Error(`Expected parsable JSON! ${e.message}`);
  }
  invariant(parsedMsg.type, "Expected a type attribute on passed in messages");

  console.log("dispatching event", parsedMsg.type, parsedMsg.data);
  switch (parsedMsg.type) {
    case WORKER_MSG_TYPES.CONFIGURE:
      return configureLanguageServer(parsedMsg.data);
    case WORKER_MSG_TYPES.VALIDATE:
      return doValidation(parsedMsg.data.uri, parsedMsg.data.content);
    case WORKER_MSG_TYPES.COMPLETE:
      return doComplete(parsedMsg.data);
    default: {
      throw new Error(`unknown msg type of ${parsedMsg.type}`);
    }
  }
};

self.addEventListener("message", (event) => {
  if (!yamlLanguageService) initializeLanguageServer();
  dispatchMessage(event.data);
});
