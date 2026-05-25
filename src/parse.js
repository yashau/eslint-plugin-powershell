import { tokenize } from "./tokenize.js";

export const visitorKeys = {
  Program: ["body"],
  PowerShellScript: ["statements", "commands", "variables", "functions", "catchClauses"],
  PowerShellStatement: ["children"],
  PowerShellCommand: [],
  PowerShellVariable: [],
  PowerShellFunction: [],
  PowerShellCatchClause: [],
};

const COMMAND_BOUNDARY = new Set(["|", ";", "{", "}"]);
const NON_COMMAND_KEYWORDS = new Set([
  "begin",
  "break",
  "catch",
  "class",
  "clean",
  "continue",
  "data",
  "do",
  "dynamicparam",
  "else",
  "elseif",
  "end",
  "filter",
  "finally",
  "for",
  "foreach",
  "from",
  "function",
  "if",
  "in",
  "param",
  "process",
  "return",
  "switch",
  "throw",
  "trap",
  "try",
  "until",
  "using",
  "while",
  "workflow",
]);

export function parsePowerShell(sourceText, options = {}) {
  const parsed = tokenize(sourceText);
  const comments = parsed.tokens.filter((token) => token.type === "Line");
  const eslintTokens = parsed.tokens.filter((token) => token.type !== "Line");
  const body = [];
  const script = node("PowerShellScript", 0, sourceText.length, parsed);
  script.sourceType = "script";
  script.filePath = options.filePath ?? "<input>";
  script.statements = buildStatements(parsed.tokens, parsed);
  script.commands = buildCommands(parsed.tokens, parsed);
  script.variables = buildVariables(parsed.tokens, parsed);
  script.functions = buildFunctions(parsed.tokens, parsed);
  script.catchClauses = buildCatchClauses(sourceText, parsed.tokens, parsed);
  body.push(script);

  return {
    type: "Program",
    sourceType: "script",
    body,
    comments,
    tokens: eslintTokens,
    range: [0, sourceText.length],
    loc: {
      start: parsed.indexToLoc(0),
      end: parsed.indexToLoc(sourceText.length),
    },
  };
}

function buildStatements(tokens, parsed) {
  const statements = [];
  let startToken = null;
  let current = [];

  for (const token of tokens) {
    if (token.type === "Line") {
      continue;
    }

    if (!startToken) {
      startToken = token;
    }
    current.push(token);

    if (token.value === ";" || token.value === "\n") {
      pushStatement();
    }
  }

  pushStatement();
  return statements;

  function pushStatement() {
    if (!startToken || current.length === 0) {
      return;
    }

    const endToken = current[current.length - 1];
    const statement = node("PowerShellStatement", startToken.range[0], endToken.range[1], parsed);
    statement.children = [];
    statement.text = parsed.source.slice(statement.range[0], statement.range[1]);
    statements.push(statement);
    startToken = null;
    current = [];
  }
}

function buildCommands(tokens, parsed) {
  const commands = [];
  let expectsCommand = true;
  let previousSignificant = null;

  for (const token of tokens) {
    if (token.type === "Line") {
      continue;
    }

    if (
      previousSignificant &&
      token.loc.start.line > previousSignificant.loc.end.line &&
      !isContinuationToken(previousSignificant)
    ) {
      expectsCommand = true;
    }

    if (token.type === "Punctuator" && COMMAND_BOUNDARY.has(token.value)) {
      expectsCommand = token.value !== "}";
      previousSignificant = token;
      continue;
    }

    if (token.type === "Keyword" && token.value.toLowerCase() === "function") {
      expectsCommand = false;
      previousSignificant = token;
      continue;
    }

    if (expectsCommand && isCommandToken(token, previousSignificant)) {
      const command = node("PowerShellCommand", token.range[0], token.range[1], parsed);
      command.name = token.value;
      command.raw = token.value;
      commands.push(command);
      expectsCommand = false;
    }

    if (token.type !== "Punctuator" || !["(", "[", ","].includes(token.value)) {
      previousSignificant = token;
    }
  }

  return commands;
}

function isContinuationToken(token) {
  return (
    (token.type === "Punctuator" && ["|", ",", "(", "[", "{"].includes(token.value)) ||
    (token.type === "Operator" && token.value !== ".")
  );
}

function buildVariables(tokens, parsed) {
  return tokens
    .filter((token) => token.type === "PowerShellVariable")
    .map((token) => {
      const variable = node("PowerShellVariable", token.range[0], token.range[1], parsed);
      variable.name = token.value;
      return variable;
    });
}

function buildFunctions(tokens, parsed) {
  const functions = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== "Keyword" || token.value.toLowerCase() !== "function") {
      continue;
    }

    const nameToken = nextMeaningfulToken(tokens, index + 1);
    if (!nameToken || !["Identifier", "Keyword"].includes(nameToken.type)) {
      continue;
    }

    const fn = node("PowerShellFunction", token.range[0], nameToken.range[1], parsed);
    fn.name = nameToken.value;
    functions.push(fn);
  }

  return functions;
}

function buildCatchClauses(sourceText, tokens, parsed) {
  const catches = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== "Keyword" || token.value.toLowerCase() !== "catch") {
      continue;
    }

    const openBrace = tokens.find((candidate, candidateIndex) => {
      return candidateIndex > index && candidate.type === "Punctuator" && candidate.value === "{";
    });
    if (!openBrace) {
      continue;
    }

    const closeBrace = findMatchingBrace(tokens, tokens.indexOf(openBrace));
    if (!closeBrace) {
      continue;
    }

    const catchClause = node("PowerShellCatchClause", token.range[0], closeBrace.range[1], parsed);
    catchClause.bodyRange = [openBrace.range[1], closeBrace.range[0]];
    catchClause.bodyText = stripComments(sourceText.slice(...catchClause.bodyRange)).trim();
    catches.push(catchClause);
  }

  return catches;
}

function isCommandToken(token, previousSignificant) {
  if (!["Identifier", "Keyword", "Punctuator"].includes(token.type)) {
    return false;
  }

  if (token.type === "Punctuator" && !["%", "?"].includes(token.value)) {
    return false;
  }

  const lower = token.value.toLowerCase();
  if (NON_COMMAND_KEYWORDS.has(lower)) {
    return false;
  }

  return !(previousSignificant?.type === "Operator" && previousSignificant.value === ".");
}

function findMatchingBrace(tokens, openBraceIndex) {
  let depth = 0;
  for (let index = openBraceIndex; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== "Punctuator") {
      continue;
    }
    if (token.value === "{") {
      depth += 1;
    }
    if (token.value === "}") {
      depth -= 1;
      if (depth === 0) {
        return token;
      }
    }
  }
  return null;
}

function nextMeaningfulToken(tokens, startIndex) {
  for (let index = startIndex; index < tokens.length; index += 1) {
    if (tokens[index].type !== "Line") {
      return tokens[index];
    }
  }
  return null;
}

function stripComments(text) {
  return text
    .split(/\r?\n/u)
    .map((line) => line.replace(/#.*/u, ""))
    .join("\n");
}

function node(type, start, end, parsed) {
  return {
    type,
    range: [start, end],
    loc: {
      start: parsed.indexToLoc(start),
      end: parsed.indexToLoc(end),
    },
  };
}
