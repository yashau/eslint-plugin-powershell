import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export async function glob(pattern, cwd) {
  const normalized = pattern.replaceAll("\\", "/");
  if (!hasGlob(normalized)) {
    return [path.resolve(cwd, pattern)];
  }

  const base = path.resolve(cwd, prefixBeforeGlob(normalized));
  const matcher = globToRegExp(path.resolve(cwd, normalized).replaceAll("\\", "/"));
  const files = [];
  await walk(base, files);
  return files.filter((filePath) => matcher.test(filePath.replaceAll("\\", "/")));
}

async function walk(directory, files) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      await walk(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    } else {
      const info = await stat(fullPath).catch(() => null);
      if (info?.isFile()) {
        files.push(fullPath);
      }
    }
  }
}

function hasGlob(pattern) {
  return /[*?{]/u.test(pattern);
}

function prefixBeforeGlob(pattern) {
  const parts = pattern.split("/");
  const prefix = [];
  for (const part of parts) {
    if (hasGlob(part)) {
      break;
    }
    prefix.push(part);
  }
  return prefix.join("/") || ".";
}

function globToRegExp(pattern) {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];
    const afterNext = pattern[index + 2];
    if (char === "*" && next === "*" && afterNext === "/") {
      source += "(?:.*/)?";
      index += 2;
    } else if (char === "*" && next === "*") {
      source += ".*";
      index += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else if (char === "{") {
      const close = pattern.indexOf("}", index);
      if (close === -1) {
        source += "\\{";
      } else {
        const alternatives = pattern
          .slice(index + 1, close)
          .split(",")
          .map(escapeRegExp)
          .join("|");
        source += `(?:${alternatives})`;
        index = close;
      }
    } else {
      source += escapeRegExp(char);
    }
  }
  return new RegExp(`^${source}$`, "u");
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/gu, "\\$&");
}
