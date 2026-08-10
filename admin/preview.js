/* ============================================================
   BLYCK CMS — Live-Vorschau
   Rendert Produkt- und Artikel-Formulare mit dem echten Seiten-CSS,
   damit die Vorschau im CMS so aussieht wie die echte Karte auf
   blyck.shop — nicht wie die generische Decap-Standardvorschau.

   Icon-Symbole unten sind aus _includes/layout.njk dupliziert
   (Cross-Referenz aus einer HTML-Datei in dieses iframe geht nicht).
   Bei neuen Platzhalter-Icons dort UND hier ergänzen.
   ============================================================ */

var CATEGORY_LABELS = {
  arbeitsplatz: "Arbeitsplatz",
  kaffee: "Kaffee & Küche",
  licht: "Licht",
  audio: "Audio",
  werkzeug: "Werkzeug",
  ordnung: "Ordnung",
  reise: "Reise",
  pflege: "Pflege",
  elektronik: "Elektronik",
  gaming: "Gaming",
  trends: "Trends"
};

var ICON_SPRITE =
  '<svg class="sprite" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">' +
  '<symbol id="p-arm" viewBox="0 0 120 120"><rect x="26" y="26" width="58" height="36" rx="2"/><path d="M55 62v8M84 44h14v34M98 78h-9M40 78h12v14H28V78h6"/></symbol>' +
  '<symbol id="p-lamp" viewBox="0 0 120 120"><path d="M40 24h30l10 20H50z"/><path d="M62 44l-8 30M40 92h44M54 74h16v18H54z"/></symbol>' +
  '<symbol id="p-grind" viewBox="0 0 120 120"><rect x="38" y="20" width="44" height="30" rx="3"/><path d="M44 50v30h32V50"/><rect x="48" y="80" width="24" height="18" rx="2"/><path d="M60 20v-6"/></symbol>' +
  '<symbol id="p-key" viewBox="0 0 120 120"><rect x="16" y="42" width="88" height="38" rx="4"/><path d="M28 54h8M42 54h8M56 54h8M70 54h8M84 54h8M28 66h8M42 66h30M78 66h14"/></symbol>' +
  '<symbol id="p-drip" viewBox="0 0 120 120"><path d="M34 34h52l-16 30H50z"/><path d="M52 64v10h16V64"/><path d="M40 96h40M56 74v22"/></symbol>' +
  '<symbol id="p-chair" viewBox="0 0 120 120"><path d="M36 20h48v34H36z"/><path d="M32 54h56M44 54v34M76 54v34M44 74h32"/></symbol>' +
  '<symbol id="p-photo" viewBox="0 0 120 120"><rect x="18" y="26" width="84" height="62" rx="3"/><circle cx="42" cy="48" r="8"/><path d="M18 78l24-22 20 18 14-12 26 22"/></symbol>' +
  '<symbol id="i-click" viewBox="0 0 24 24"><path d="M9 4.5v9.8l2.6-2.3 2.1 4.6 2.3-1-2.1-4.6h3.4z"/><path d="M4.5 9h-2M6.2 5.2L4.8 3.8M9 2.5v-2"/></symbol>' +
  "</svg>";

function catLabel(key) {
  return CATEGORY_LABELS[key] || key || "";
}

function deNumber(n) {
  if (n === undefined || n === null || n === "") return "0";
  return Number(n).toLocaleString("de-DE");
}

/* ---------- Produkt-Vorschau ---------- */
var ProductPreview = createClass({
  render: function () {
    var e = this.props.entry.get("data").toObject();
    var imageUrl = e.image ? this.props.getAsset(e.image).toString() : null;

    return h(
      "div",
      { style: { padding: "32px", background: "#fff", fontFamily: "Poppins, sans-serif" } },
      h("div", { dangerouslySetInnerHTML: { __html: ICON_SPRITE } }),
      h(
        "article",
        { className: "product", style: { maxWidth: "280px" } },
        h(
          "div",
          { className: "product__media" },
          e.badge ? h("span", { className: "tagbadge" }, e.badge) : null,
          imageUrl
            ? h("img", { src: imageUrl, alt: e.title || "" })
            : h(
                "svg",
                { className: "ph" },
                h("use", { href: "#" + (e.icon || "p-photo") })
              )
        ),
        h("p", { className: "product__cat" }, catLabel(e.categoryKey)),
        h("h3", { className: "product__title" }, e.title || "(kein Titel)"),
        e.shortDesc ? h("p", { className: "product__desc" }, e.shortDesc) : null,
        h(
          "p",
          { className: "pop" },
          h("svg", { className: "ic ic--14" }, h("use", { href: "#i-click" })),
          " " + deNumber(e.baseClicks) + " Klicks"
        ),
        h(
          "p",
          { className: "price" },
          e.oldPrice ? h("del", {}, "€ " + e.oldPrice) : null,
          " € " + (e.price || "0,00")
        ),
        h(
          "p",
          { className: "price__note" },
          "Preis kann abweichen · Stand " + (e.priceDate || "—")
        ),
        h(
          "a",
          { className: "btn btn--primary btn--block", href: "#" },
          "Zum Angebot"
        )
      )
    );
  }
});

/* ---------- Artikel-Vorschau ---------- */
var ArticlePreview = createClass({
  render: function () {
    var e = this.props.entry.get("data").toObject();
    var coverUrl = e.coverImage ? this.props.getAsset(e.coverImage).toString() : null;
    var sections = e.sections || [];

    return h(
      "div",
      { style: { padding: "32px", background: "#fff", fontFamily: "Poppins, sans-serif" } },
      h("div", { dangerouslySetInnerHTML: { __html: ICON_SPRITE } }),
      h(
        "div",
        { style: { maxWidth: "680px", margin: "0 auto" } },
        h(
          "div",
          { className: "article__cover" },
          coverUrl
            ? h("img", { src: coverUrl, alt: e.title || "" })
            : h(
                "svg",
                { className: "ph ph--post" },
                h("use", { href: "#" + (e.cover || "p-photo") })
              )
        ),
        h("p", { className: "product__cat" }, catLabel(e.categoryKey)),
        h("h1", { className: "pd__title" }, e.title || "(kein Titel)"),
        h(
          "p",
          { className: "price__note" },
          (e.dateDay || "") + " " + (e.dateMonthYear || "") + " · " + (e.readTime || "")
        ),
        h(
          "p",
          { className: "disclosure", style: { margin: "16px 0" } },
          "Werbung · Dieser Artikel enthält Affiliate-Links."
        ),
        e.intro ? h("p", { style: { marginBottom: "24px", lineHeight: "1.8" } }, e.intro) : null,
        sections.map(function (s, i) {
          return h(
            "div",
            { key: i, style: { marginBottom: "20px" } },
            h("h3", {}, s.heading || ""),
            h("p", { style: { lineHeight: "1.8" } }, s.text || ""),
            s.embedProductId
              ? h(
                  "p",
                  {
                    style: {
                      display: "inline-block",
                      marginTop: "8px",
                      padding: "6px 12px",
                      background: "var(--band)",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "var(--tag)"
                    }
                  },
                  "🔗 Produkt eingebettet: " + s.embedProductId
                )
              : null
          );
        })
      )
    );
  }
});

CMS.registerPreviewStyle(
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
);
CMS.registerPreviewStyle("/assets/css/style.css");
CMS.registerPreviewTemplate("products", ProductPreview);
CMS.registerPreviewTemplate("articles", ArticlePreview);
