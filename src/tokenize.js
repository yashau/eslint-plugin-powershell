const KEYWORDS = new Set([
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

const PUNCTUATORS = new Set(["(", ")", "{", "}", "[", "]", ",", ";", "|"]);
const OPERATORS = new Set(["=", "+", "-", "*", "/", "%", "!", ".", ":", "<", ">"]);

export function tokenize(source) {
  const lineStarts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "\n") {
      lineStarts.push(index + 1);
    }
  }

  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === "\r" || char === "\n" || isWhitespace(char)) {
      index += 1;
      continue;
    }

    if (char === "#") {
      const start = index;
      while (index < source.length && source[index] !== "\n") {
        index += 1;
      }
      tokens.push(makeToken("Line", source.slice(start, index), start, index));
      continue;
    }

    if (char === "'" || char === '"') {
      const start = index;
      const quote = char;
      index += 1;
      while (index < source.length) {
        if (source[index] === "`") {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          if (source[index] === quote) {
            index += 1;
            continue;
          }
          break;
        }
        index += 1;
      }
      tokens.push(makeToken("String", source.slice(start, index), start, index));
      continue;
    }

    if (char === "$") {
      const start = index;
      index += 1;
      if (source[index] === "{") {
        index += 1;
        while (index < source.length && source[index] !== "}") {
          index += 1;
        }
        if (source[index] === "}") {
          index += 1;
        }
      } else {
        while (index < source.length && /[\w:?]/u.test(source[index])) {
          index += 1;
        }
      }
      tokens.push(makeToken("PowerShellVariable", source.slice(start, index), start, index));
      continue;
    }

    if (char === "-" && isNameStart(source[index + 1])) {
      const start = index;
      index += 1;
      while (index < source.length && isNamePart(source[index])) {
        index += 1;
      }
      tokens.push(makeToken("PowerShellParameter", source.slice(start, index), start, index));
      continue;
    }

    if (isDigit(char)) {
      const start = index;
      while (index < source.length && /[\d._a-fx]/iu.test(source[index])) {
        index += 1;
      }
      tokens.push(makeToken("Numeric", source.slice(start, index), start, index));
      continue;
    }

    if (isNameStart(char)) {
      const start = index;
      index += 1;
      while (index < source.length && isNamePart(source[index])) {
        index += 1;
      }
      const value = source.slice(start, index);
      const type = KEYWORDS.has(value.toLowerCase()) ? "Keyword" : "Identifier";
      tokens.push(makeToken(type, value, start, index));
      continue;
    }

    if (PUNCTUATORS.has(char)) {
      tokens.push(makeToken("Punctuator", char, index, index + 1));
      index += 1;
      continue;
    }

    if (OPERATORS.has(char)) {
      const start = index;
      index += 1;
      while (index < source.length && OPERATORS.has(source[index])) {
        index += 1;
      }
      tokens.push(makeToken("Operator", source.slice(start, index), start, index));
      continue;
    }

    tokens.push(makeToken("Punctuator", char, index, index + 1));
    index += 1;
  }

  for (const token of tokens) {
    token.loc = {
      start: indexToLoc(token.range[0]),
      end: indexToLoc(token.range[1]),
    };
  }

  return {
    source,
    tokens,
    lineStarts,
    indexToLoc,
  };

  function indexToLoc(offset) {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lineStarts[mid] <= offset) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const lineIndex = Math.max(0, high);
    return {
      line: lineIndex + 1,
      column: offset - lineStarts[lineIndex],
    };
  }
}

function makeToken(type, value, start, end) {
  return {
    type,
    value,
    range: [start, end],
  };
}

function isWhitespace(char) {
  return char === " " || char === "\t" || char === "\v" || char === "\f";
}

function isDigit(char) {
  return char >= "0" && char <= "9";
}

function isNameStart(char) {
  return typeof char === "string" && /[A-Za-z_]/u.test(char);
}

function isNamePart(char) {
  return typeof char === "string" && /[A-Za-z0-9_-]/u.test(char);
}
