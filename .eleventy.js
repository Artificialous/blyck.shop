const categories = require("./_data/categories.json");

module.exports = function (eleventyConfig) {
  // Statische Assets 1:1 mit ausliefern
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");

  // Interne Planungsdokumente NICHT mit ausliefern
  // blyck-vorschau.html ist ein statisches Design-Mockup mit veralteten
  // Produktangaben. Bleibt als Referenz im Repo, darf aber nicht publiziert
  // werden — sonst stehen falsche Specs oeffentlich neben den echten Seiten.
  eleventyConfig.ignores.add("blyck-vorschau.html");
  eleventyConfig.ignores.add("BLYCK_Design_System.md");
  eleventyConfig.ignores.add("BLYCK_Startseite_Desktop.png");
  eleventyConfig.ignores.add("README.md");

  // macOS-AppleDouble-Dateien (._*) nie als Templates behandeln
  eleventyConfig.ignores.add("**/._*");

  eleventyConfig.addFilter("deNumber", function (n) {
    if (n === undefined || n === null || n === "") return "0";
    return Number(n).toLocaleString("de-DE");
  });

  // ISO-Datum fuer sitemap.xml <lastmod> — Eleventy hat keinen
  // eingebauten date-Filter mit Formatstring.
  eleventyConfig.addFilter("isoDate", function (dateInput) {
    var d = new Date(dateInput);
    if (isNaN(d)) return "";
    return d.toISOString().slice(0, 10);
  });

  eleventyConfig.addFilter("catLabel", function (key) {
    var found = categories.find(function (c) { return c.key === key; });
    return found ? found.label : key;
  });

  eleventyConfig.addFilter("catIcon", function (key) {
    var found = categories.find(function (c) { return c.key === key; });
    return found ? found.icon : "c-box";
  });

  eleventyConfig.addFilter("catCount", function (key, products) {
    if (!products) return 0;
    return products.filter(function (p) { return p.categoryKey === key; }).length;
  });

  // Produkte/Artikel als flache Datenobjekte, damit Templates
  // direkt p.title statt p.data.title schreiben koennen.
  eleventyConfig.addCollection("productsData", function (api) {
    return api.getFilteredByTag("products")
      .map(function (item) { return item.data; })
      .filter(function (p) { return p.published !== false; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  });

  eleventyConfig.addCollection("productsWithDetailPage", function (api) {
    return api.getFilteredByTag("products")
      .map(function (item) { return item.data; })
      .filter(function (p) { return p.published !== false && p.hasDetailPage; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  });

  var MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  eleventyConfig.addFilter("readableDate", function (dateInput) {
    var d = new Date(dateInput);
    if (isNaN(d)) return dateInput;
    var day = String(d.getUTCDate()).padStart(2, "0");
    return day + ". " + MONTHS_DE[d.getUTCMonth()] + " " + d.getUTCFullYear();
  });

  eleventyConfig.addFilter("findProduct", function (id, allProducts) {
    if (!allProducts) return null;
    return allProducts.find(function (p) { return p.id === id; }) || null;
  });

  eleventyConfig.addFilter("rejectattr_id", function (list, excludeId) {
    if (!list) return [];
    return list.filter(function (item) { return item.id !== excludeId; });
  });

  eleventyConfig.addFilter("limit", function (list, n) {
    if (!list) return [];
    return list.slice(0, n);
  });

  eleventyConfig.addFilter("relatedProducts", function (product, allProducts) {
    if (!allProducts) return [];
    if (product.relatedIds && product.relatedIds.length) {
      return product.relatedIds
        .map(function (rid) { return allProducts.find(function (p) { return p.id === rid; }); })
        .filter(Boolean);
    }
    return allProducts.filter(function (p) { return p.id !== product.id; }).slice(0, 3);
  });

  eleventyConfig.addCollection("topClicked", function (api) {
    return api.getFilteredByTag("products")
      .map(function (item) { return item.data; })
      .filter(function (p) { return p.published !== false; })
      .sort(function (a, b) { return (b.baseClicks || 0) - (a.baseClicks || 0); })
      .slice(0, 5);
  });

  eleventyConfig.addCollection("articlesData", function (api) {
    return api.getFilteredByTag("articles")
      .map(function (item) { return item.data; })
      .filter(function (a) { return a.published !== false; })
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
