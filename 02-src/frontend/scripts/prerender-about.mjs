import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.js";
import { createServer } from "vite";

// Render the existing page; never maintain a second copy of the About content.
// Middleware mode opens no HTTP listener. No browser or production service is needed.
const vite = await createServer({
  appType: "custom",
  server: { middlewareMode: true, hmr: false, watch: null },
});
try {
  const { default: About } = await vite.ssrLoadModule("/src/src/pages/About.tsx");
  const { ABOUT_METADATA } = await vite.ssrLoadModule("/src/src/lib/aboutMetadata.ts");
  const body = renderToStaticMarkup(
    createElement(StaticRouter, { location: "/about" }, createElement(About))
  );
  let html = await readFile("dist/index.html", "utf8");
  const replaceOne = (pattern, replacement) => {
    assert.equal(
      [...html.matchAll(new RegExp(pattern.source, "g"))].length,
      1,
      `Expected exactly one template target: ${pattern}`
    );
    html = html.replace(pattern, () => replacement);
  };
  const escape = (text) =>
    text.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]
    );
  const title = escape(ABOUT_METADATA.title);
  const description = escape(ABOUT_METADATA.description);
  replaceOne(/<div id="root"><\/div>/, `<div id="root">${body}</div>`);
  replaceOne(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  replaceOne(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${description}">`
  );
  replaceOne(
    /<link\s+rel="canonical"[^>]*>/,
    '<link rel="canonical" href="https://diagnosticpro.io/about">'
  );
  for (const [attribute, name, content] of [
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:url", "https://diagnosticpro.io/about"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
  ]) {
    replaceOne(
      new RegExp(`<meta\\s+${attribute}="${name}"[^>]*>`),
      `<meta ${attribute}="${name}" content="${content}">`
    );
  }
  assert.equal((body.match(/<h1[ >]/g) || []).length, 1);
  assert.equal((body.match(/<h2[ >]/g) || []).length, 7);
  assert.ok(body.includes("<table") && body.includes('"@type":"FAQPage"'));
  await mkdir("dist/about", { recursive: true });
  await writeFile("dist/about/index.html", html);
  console.log(
    "About page rendered: all eight sections, key facts, FAQ, and route metadata in static HTML."
  );
} finally {
  await vite.close();
}
