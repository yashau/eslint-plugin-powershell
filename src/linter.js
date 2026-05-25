import { parsePowerShell } from "./parse.js";
import plugin from "./index.js";

const DEFAULT_RULES = {
  ...Object.fromEntries(
    Object.entries(plugin.rules)
      .filter(([ruleId, rule]) => /^PS/u.test(ruleId) && rule.meta.docs.recommended)
      .map(([ruleId, rule]) => [`powershell/${ruleId}`, rule.meta.defaultSeverity === "error" ? 2 : 1]),
  ),
};

export function lintText(sourceText, options = {}) {
  const ast = parsePowerShell(sourceText, {
    filePath: options.filePath,
  });
  const configuredRules = options.rules ?? DEFAULT_RULES;
  const messages = [];

  for (const [ruleId, severityConfig] of Object.entries(configuredRules)) {
    const severity = normalizeSeverity(severityConfig);
    if (severity === 0) {
      continue;
    }

    const shortRuleId = ruleId.replace(/^powershell\//u, "");
    const rule = plugin.rules[shortRuleId];
    if (!rule) {
      continue;
    }

    const context = createRuleContext(ruleId, severity, sourceText, messages);
    const listeners = rule.create(context);
    walk(ast, listeners);
  }

  return {
    filePath: options.filePath ?? "<input>",
    messages: messages.sort((left, right) => {
      return left.line - right.line || left.column - right.column || left.ruleId.localeCompare(right.ruleId);
    }),
    errorCount: messages.filter((message) => message.severity === 2).length,
    warningCount: messages.filter((message) => message.severity === 1).length,
  };
}

function createRuleContext(ruleId, severity, sourceText, messages) {
  return {
    id: ruleId,
    sourceCode: {
      text: sourceText,
      getText(node) {
        return node ? sourceText.slice(node.range[0], node.range[1]) : sourceText;
      },
    },
    report(descriptor) {
      const node = descriptor.node;
      const loc = descriptor.loc ?? node?.loc?.start ?? { line: 1, column: 0 };
      messages.push({
        ruleId,
        severity,
        message: descriptor.message,
        line: loc.line,
        column: loc.column + 1,
        nodeType: node?.type,
      });
    },
  };
}

function normalizeSeverity(config) {
  const value = Array.isArray(config) ? config[0] : config;
  if (value === "off" || value === 0) {
    return 0;
  }
  if (value === "warn" || value === 1) {
    return 1;
  }
  return 2;
}

function walk(node, listeners) {
  if (!node || typeof node.type !== "string") {
    return;
  }

  listeners[node.type]?.(node);

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child.type === "string") {
          walk(child, listeners);
        }
      }
    } else if (value && typeof value.type === "string") {
      walk(value, listeners);
    }
  }
}
