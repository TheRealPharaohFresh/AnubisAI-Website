const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { createServer } = require("../server");

const root = path.resolve(__dirname, "..");
const routes = [
  "index.html",
  "info.html",
  "product.html",
  "pricing.html",
  "downloads.html",
  "about.html",
  "support.html",
  "privacy.html",
  "terms.html",
  "billing.html",
  "cancellation.html",
];
let server;
let origin;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("all public routes return HTML with a page title", async () => {
  for (const route of routes) {
    const response = await fetch(`${origin}/${route}`);
    assert.equal(response.status, 200, `${route} should load`);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(await response.text(), /<title>[^<]+<\/title>/);
  }
});

test("all local page links point to an existing file", () => {
  for (const route of routes) {
    const html = fs.readFileSync(path.join(root, route), "utf8");
    const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const link of links) {
      if (/^(?:https?:|mailto:|#|data:)/.test(link)) continue;
      const target = path.resolve(root, link.split("#")[0].split("?")[0]);
      assert.ok(target.startsWith(`${root}${path.sep}`), `${route} contains an in-root link`);
      assert.ok(fs.existsSync(target), `${route} links to existing ${link}`);
    }
  }
});

test("pricing is configured in one public source and shows both intended monthly prices", async () => {
  const config = fs.readFileSync(path.join(root, "site-config.js"), "utf8");
  const response = await fetch(`${origin}/pricing.html`);
  const html = await response.text();
  assert.match(config, /betaPrice:\s*"9\.99"/);
  assert.match(config, /fullPrice:\s*"19\.99"/);
  assert.match(html, /data-price="beta"/);
  assert.match(html, /data-price="full"/);
  assert.match(html, /not currently available for purchase/i);
});

test("release catalog has only the original edition marked coming soon and no unverified binaries", () => {
  const config = fs.readFileSync(path.join(root, "site-config.js"), "utf8");
  assert.match(config, /id: "anubis"[\s\S]*?availability: "Coming soon"[\s\S]*?downloadUrl: null/);
  assert.match(config, /id: "zeus"[\s\S]*?availability: "Planned"/);
  assert.match(config, /id: "odin"[\s\S]*?availability: "Planned"/);
  assert.match(config, /id: "anu"[\s\S]*?availability: "Planned"/);
  assert.doesNotMatch(config, /waitlist/i);
});

test("static server rejects unsupported methods and emits baseline security headers", async () => {
  const response = await fetch(`${origin}/index.html`, { method: "POST" });
  assert.equal(response.status, 405);
  const page = await fetch(`${origin}/index.html`);
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.equal(page.headers.get("x-frame-options"), "DENY");
  assert.match(page.headers.get("content-security-policy"), /frame-ancestors 'none'/);
});

test("signup and feedback forms are not presented", () => {
  const support = fs.readFileSync(path.join(root, "support.html"), "utf8");
  const behavior = fs.readFileSync(path.join(root, "site.js"), "utf8");
  assert.doesNotMatch(support, /<form\b|feedback form|signup form/i);
  assert.doesNotMatch(behavior, /waitlist|feedbackForm|data-feedback-form/i);
  for (const page of ["index.html", "info.html", "product.html", "pricing.html", "downloads.html", "about.html", "support.html"]) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.doesNotMatch(html, /beta\.html|beta access|waitlist|registration is not open/i, `${page} has no signup CTA`);
  }
});

test("the home page is concise and points to separate information, pricing, and download pages", () => {
  const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(home, /href="info\.html"/);
  assert.match(home, /href="product\.html"/);
  assert.match(home, /href="pricing\.html"/);
  assert.match(home, /href="downloads\.html"/);
  assert.doesNotMatch(home, /data-price=/);
});

test("main navigation separates product links from company links and exposes dedicated routes", () => {
  const script = fs.readFileSync(path.join(root, "site.js"), "utf8");
  assert.match(script, /nav-group" role="group" aria-label="Product pages"/);
  assert.match(script, /nav-company-group" role="group" aria-label="Company pages"/);
  for (const label of ["Product", "Technical info", "Pricing", "Downloads", "About", "Support"]) {
    assert.ok(script.includes(`["${label}"`), `navigation includes ${label}`);
  }
});

test("product pages describe current agents and explicitly state key release and security limits", () => {
  const product = fs.readFileSync(path.join(root, "product.html"), "utf8");
  const info = fs.readFileSync(path.join(root, "info.html"), "utf8");
  const downloads = fs.readFileSync(path.join(root, "downloads.html"), "utf8");
  assert.match(product, /Thoth/);
  assert.match(product, /owner-approved project/i);
  assert.match(product, /does not stop a subprocess already running/i);
  assert.match(info, /qwen3\.5:4b/);
  assert.match(info, /cloud use is disabled by default/i);
  assert.match(info, /authentication is not implemented/i);
  assert.match(downloads, /unsigned, unnotarized Intel macOS/i);
  assert.match(downloads, /Apple Silicon, Windows, and Linux/i);
});

test("release catalog validation rejects unsafe or incomplete entries", () => {
  const { validateRelease, validateCatalog } = require("../release-catalog");
  const origin = "https://example.test/";
  const good = {
    id: "anubis", name: "Anubis AI", availability: "Available", version: "1.0.0",
    operatingSystems: ["macOS (Intel)"], requirements: [], releaseNotes: [],
    downloadUrl: "https://example.test/dl/anubis.dmg", checksum: "a".repeat(64),
    releaseDate: "2026-01-01", fileSize: 1024,
  };
  assert.equal(validateRelease(good, origin).downloadable, true);
  for (const bad of [
    { ...good, downloadUrl: "javascript:alert(1)" },
    { ...good, downloadUrl: "http://example.test/a.dmg" },
    { ...good, downloadUrl: "https://user:pw@example.test/a.dmg" },
    { ...good, checksum: "xyz" },
    { ...good, version: null },
    { ...good, operatingSystems: [] },
    { ...good, releaseDate: "yesterday" },
    { ...good, availability: "Planned" },
  ]) {
    const result = validateRelease(bad, origin);
    assert.equal(result.downloadable, false, JSON.stringify(bad));
    assert.equal(result.valid, false);
  }
  assert.equal(validateCatalog([good, good], origin).valid, false);
});

test("shipped release catalog is valid and has no approved downloads", () => {
  const { validateCatalog, validateRelease } = require("../release-catalog");
  const vm = require("node:vm");
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "site-config.js"), "utf8"), sandbox);
  const { releases } = sandbox.window.ANUBIS_CONFIG;
  const result = validateCatalog(releases, "https://example.test/");
  assert.deepEqual(result.errors, []);
  assert.equal(releases.filter((r) => validateRelease(r, "https://example.test/").downloadable).length, 0);
  assert.equal(releases.find((r) => r.id === "anubis").availability, "Coming soon");
  for (const id of ["zeus", "odin", "anu"]) assert.equal(releases.find((r) => r.id === id).availability, "Planned");
});

test("public config holds no secrets", () => {
  const text = fs.readFileSync(path.join(__dirname, "..", "site-config.js"), "utf8");
  assert.doesNotMatch(text, /(secret|api[_-]?key|token|password|sk_live|whsec)/i);
});
