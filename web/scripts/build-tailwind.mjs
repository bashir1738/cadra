import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { compile } from "tailwindcss";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, "..");
const srcDir = path.join(webDir, "src");
const outFile = path.join(srcDir, "app", "tailwind.css");
const tailwindPkgDir = path.join(webDir, "node_modules", "tailwindcss");

function walkFiles(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, exts, out);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

function extractCandidates(files) {
  const candidates = new Set();
  // Broad token matcher that catches standard utilities, arbitrary values, variants, and negative/important prefixes
  const tokenRe = /[a-zA-Z0-9_:@[\]/.#%(),!'-]+/g;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(tokenRe);
    if (!matches) continue;
    for (const raw of matches) {
      // Trim trailing/leading quotes or punctuation
      const cleaned = raw.replace(/^['"`(]+|['"`,;.)]+$/g, "");
      if (cleaned.length > 0 && cleaned.length < 140) {
        candidates.add(cleaned);
      }
      // Also split by common JSX/JS delimiters inside template strings
      if (cleaned.includes("`") || cleaned.includes('"') || cleaned.includes("'")) {
        for (const sub of cleaned.split(/['"`]+/)) {
          if (sub.length > 0 && sub.length < 140) {
            candidates.add(sub);
          }
        }
      }
    }
  }
  return Array.from(candidates);
}

async function main() {
  const start = Date.now();
  const files = walkFiles(srcDir, [".tsx", ".ts", ".jsx", ".js"]);
  const candidates = extractCandidates(files);

  const baseCss = fs.readFileSync(path.join(tailwindPkgDir, "index.css"), "utf8");
  const compiler = await compile(baseCss, {
    loadStylesheet: async (id, base) => {
      const resolved = id.startsWith(".")
        ? path.resolve(base, id)
        : path.resolve(tailwindPkgDir, id.endsWith(".css") ? id : `${id}.css`);
      return {
        path: resolved,
        base: path.dirname(resolved),
        content: fs.readFileSync(resolved, "utf8"),
      };
    },
  });

  const css = compiler.build(candidates);
  fs.writeFileSync(outFile, css, "utf8");
  const elapsed = Date.now() - start;
  console.log(
    `[tailwind] Compiled ${candidates.length} candidates from ${files.length} files -> ${(
      css.length / 1024
    ).toFixed(1)}KB in ${elapsed}ms`
  );
}

main().catch((err) => {
  console.error("[tailwind] Build failed:", err);
  process.exit(1);
});
