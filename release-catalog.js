(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AnubisReleaseCatalog = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const STATUSES = ["Available", "Coming soon", "Planned", "Unavailable"];
  const SHA256 = /^[a-f0-9]{64}$/i;
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const ID = /^[a-z][a-z0-9-]*$/;

  function safeDownloadUrl(value, baseOrigin) {
    if (typeof value !== "string" || !value.trim()) return null;
    let url;
    try {
      url = baseOrigin ? new URL(value, baseOrigin) : new URL(value);
    } catch (error) {
      return null;
    }
    if (url.username || url.password) return null;
    const sameOrigin = baseOrigin && url.origin === new URL(baseOrigin).origin && url.protocol === "https:";
    return url.protocol === "https:" || sameOrigin ? url.href : null;
  }

  // Returns { valid, errors, downloadable, downloadUrl } for one catalog entry.
  // An entry is downloadable only when it is "Available" and fully described.
  function validateRelease(release, baseOrigin) {
    const errors = [];
    if (!release || typeof release !== "object") {
      return { valid: false, errors: ["Entry is not an object"], downloadable: false, downloadUrl: null };
    }
    if (!ID.test(release.id || "")) errors.push("id must be a stable lowercase identifier");
    if (!release.name) errors.push("name is required");
    if (!STATUSES.includes(release.availability)) errors.push(`availability must be one of: ${STATUSES.join(", ")}`);
    ["operatingSystems", "requirements", "releaseNotes"].forEach((key) => {
      if (!Array.isArray(release[key])) errors.push(`${key} must be an array`);
    });
    if (release.checksum != null && !SHA256.test(release.checksum)) errors.push("checksum must be a 64-character SHA-256 hex digest");
    if (release.releaseDate != null && !ISO_DATE.test(release.releaseDate)) errors.push("releaseDate must be YYYY-MM-DD");
    if (release.fileSize != null && !(Number.isFinite(release.fileSize) && release.fileSize > 0)) errors.push("fileSize must be a positive number of bytes");

    const downloadUrl = release.downloadUrl == null ? null : safeDownloadUrl(release.downloadUrl, baseOrigin);
    if (release.downloadUrl != null && !downloadUrl) errors.push("downloadUrl must be a safe HTTPS URL");

    if (release.availability === "Available") {
      if (!release.version) errors.push("Available releases require a version");
      if (!Array.isArray(release.operatingSystems) || !release.operatingSystems.length) errors.push("Available releases require operatingSystems");
      if (!downloadUrl) errors.push("Available releases require a valid HTTPS downloadUrl");
    } else if (release.downloadUrl != null) {
      errors.push("Only Available releases may have a downloadUrl");
    }

    const valid = errors.length === 0;
    return {
      valid,
      errors,
      downloadable: valid && release.availability === "Available",
      downloadUrl: valid && release.availability === "Available" ? downloadUrl : null,
    };
  }

  function validateCatalog(releases, baseOrigin) {
    const errors = [];
    if (!Array.isArray(releases)) return { valid: false, errors: ["releases must be an array"] };
    const seen = new Set();
    releases.forEach((release, index) => {
      const result = validateRelease(release, baseOrigin);
      result.errors.forEach((message) => errors.push(`${(release && release.id) || `#${index}`}: ${message}`));
      if (release && seen.has(release.id)) errors.push(`${release.id}: duplicate id`);
      if (release) seen.add(release.id);
    });
    return { valid: errors.length === 0, errors };
  }

  return { STATUSES, safeDownloadUrl, validateRelease, validateCatalog };
});
