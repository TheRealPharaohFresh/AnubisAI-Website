(() => {
  const config = window.ANUBIS_CONFIG;
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navigation = [
    ["Product", "product.html"],
    ["Technical info", "info.html"],
    ["Pricing", "pricing.html"],
    ["Downloads", "downloads.html"],
    ["About", "about.html"],
    ["Support", "support.html"],
  ];

  const logo = `
    <a class="brand" href="index.html" aria-label="Anubis AI home">
      <span class="brand-mark" aria-hidden="true"><span></span></span>
      <span>ANUBIS<span class="brand-light"> AI</span></span>
    </a>`;

  const header = document.querySelector("[data-site-header]");
  if (header) {
    header.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <div class="nav-wrap">
        ${logo}
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation">
          <span class="sr-only">Open navigation</span><span class="menu-icon" aria-hidden="true"></span>
        </button>
        <nav class="primary-nav" id="primary-navigation" aria-label="Main navigation">
          <div class="nav-group" role="group" aria-label="Product pages">
            ${navigation.slice(0, 4).map(([label, href]) =>
              `<a href="${href}"${currentPath === href ? ' aria-current="page"' : ""}>${label}</a>`
            ).join("")}
          </div>
          <span class="nav-divider" aria-hidden="true"></span>
          <div class="nav-group nav-company-group" role="group" aria-label="Company pages">
            ${navigation.slice(4).map(([label, href]) =>
              `<a href="${href}"${currentPath === href ? ' aria-current="page"' : ""}>${label}</a>`
            ).join("")}
          </div>
        </nav>
      </div>`;
  }

  const footer = document.querySelector("[data-site-footer]");
  if (footer) {
    footer.innerHTML = `
      <div class="footer-main">
        <div class="footer-brand">${logo}
          <p>A considered home for specialized AI workflows. Built with care, one release at a time.</p>
        </div>
        <div class="footer-links">
          <div><h2>Product</h2><a href="product.html">Product</a><a href="info.html">Technical information</a><a href="pricing.html">Pricing</a><a href="downloads.html">Downloads</a></div>
          <div><h2>Company</h2><a href="about.html">About</a><a href="support.html">Support</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a></div>
          <div><h2>Policies</h2><a href="billing.html">Billing terms</a><a href="cancellation.html">Cancellation &amp; refunds</a></div>
        </div>
      </div>
      <div class="footer-bottom"><span>© <span data-year></span> Anubis AI</span><span>Independent product. No mythology required.</span></div>`;
  }

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  document.querySelectorAll("[data-price='beta']").forEach((node) => {
    node.textContent = `$${config.betaPrice}`;
  });
  document.querySelectorAll("[data-price='full']").forEach((node) => {
    node.textContent = `$${config.fullPrice}`;
  });

  const supportContact = document.querySelector("[data-support-contact]");
  if (supportContact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.supportEmail)) {
    const link = document.createElement("a");
    link.href = `mailto:${config.supportEmail}`;
    link.textContent = config.supportEmail;
    supportContact.replaceChildren(link);
  }

  const menuButton = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  if (menuButton && primaryNav) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.querySelector(".sr-only").textContent = isOpen ? "Open navigation" : "Close navigation";
      primaryNav.classList.toggle("is-open", !isOpen);
    });
    primaryNav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.querySelector(".sr-only").textContent = "Open navigation";
        primaryNav.classList.remove("is-open");
      }
    });
  }

  const editionGrid = document.querySelector("[data-edition-grid]");
  if (editionGrid) {
    const cards = config.releases.map((release) => {
      const card = document.createElement("article");
      card.className = "edition-card";

      const status = document.createElement("span");
      status.className = `status-pill${release.availability === "Planned" ? " muted" : ""}`;
      status.textContent = release.availability;
      card.append(status);

      const glyph = document.createElement("div");
      glyph.className = "edition-glyph";
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = "◇";
      card.append(glyph);

      const inspiration = document.createElement("p");
      inspiration.className = "eyebrow";
      inspiration.textContent = release.inspiration;
      card.append(inspiration);

      const title = document.createElement("h2");
      title.textContent = release.name;
      card.append(title);

      const description = document.createElement("p");
      description.textContent = release.description;
      card.append(description);

      if (release.version) {
        const version = document.createElement("p");
        version.className = "edition-note";
        version.textContent = `Version ${release.version}`;
        card.append(version);
      }
      if (release.operatingSystems.length) {
        const systems = document.createElement("p");
        systems.className = "edition-note";
        systems.textContent = `Supported: ${release.operatingSystems.join(", ")}`;
        card.append(systems);
      }
      if (release.requirements.length) {
        const requirements = document.createElement("p");
        requirements.className = "edition-note";
        requirements.textContent = `Requirements: ${release.requirements.join("; ")}`;
        card.append(requirements);
      }
      if (release.releaseNotes.length) {
        const notes = document.createElement("ul");
        notes.className = "release-notes";
        release.releaseNotes.forEach((note) => {
          const item = document.createElement("li");
          item.textContent = note;
          notes.append(item);
        });
        card.append(notes);
      }
      if (release.checksum) {
        const checksum = document.createElement("p");
        checksum.className = "edition-note";
        checksum.textContent = `SHA-256: ${release.checksum}`;
        card.append(checksum);
      }

      let downloadUrl;
      if (release.downloadUrl) {
        try {
          const candidate = new URL(release.downloadUrl, window.location.href);
          if (candidate.protocol === "https:" || candidate.origin === window.location.origin) {
            downloadUrl = candidate.href;
          }
        } catch (error) {
          console.error(`Invalid release URL for ${release.id}:`, error);
        }
      }
      if (release.availability === "Available" && release.version && release.operatingSystems.length && downloadUrl) {
        const link = document.createElement("a");
        link.className = "text-link";
        link.href = downloadUrl;
        link.textContent = `Download ${release.name} ↗`;
        card.append(link);
      } else {
        const note = document.createElement("span");
        note.className = "edition-note";
        note.textContent = release.availability === "Planned" ? "Not available yet" : "Downloads coming soon";
        card.append(note);
      }
      return card;
    });
    editionGrid.replaceChildren(...cards);
  }
})();
