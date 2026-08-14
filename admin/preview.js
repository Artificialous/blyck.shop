/* ============================================================
   BLYCK CMS — Live-Vorschau
   Rendert Produkt- und Artikel-Formulare mit dem echten Seiten-CSS,
   damit die Vorschau im CMS so aussieht wie die echte Karte auf
   blyck.shop — nicht wie die generische Decap-Standardvorschau.

   Icon-Symbole unten sind aus _includes/layout.njk dupliziert
   (Cross-Referenz aus einer HTML-Datei in dieses iframe geht nicht).
   Bei neuen Platzhalter-Icons dort UND hier ergänzen.

   Hero-Karussell (p1/p3/p6) und Promo-Kachel (p2) sind in index.njk
   fest auf diese Produkt-IDs verdrahtet, nicht ueber das CMS
   konfigurierbar — die Vorschau hier spiegelt dieselbe Zuordnung, wird
   also mit angepasst, falls sich das in index.njk mal aendert.
   ============================================================ */

var HERO_CAROUSEL_IDS = ["p1", "p3", "p6"];
var HERO_PROMO_ID = "p2";

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
  '<symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20.5l-7.3-7A4.6 4.6 0 1112 6.6a4.6 4.6 0 117.3 6.9z"/></symbol>' +
  "</svg>";

function catLabel(key) {
  return CATEGORY_LABELS[key] || key || "";
}

function deNumber(n) {
  if (n === undefined || n === null || n === "") return "0";
  return Number(n).toLocaleString("de-DE");
}

/* Seit Decap CMS 2.10 liefert getAsset() ein Promise zurueck statt eines
   sofort per .toString() lesbaren Objekts — ein direkter .toString()-
   Aufruf ergibt nur noch den nutzlosen String "[object Promise]"
   (https://github.com/decaporg/decap-cms/issues/3062). Deshalb hier
   ueber State aufgeloest: liegt der Pfad schon im Cache, sofort
   zurueckgeben; sonst getAsset() aufrufen, bei einem Promise per .then()
   auf das Ergebnis warten und per setState neu rendern, sobald es da
   ist (Erstaufruf zeigt in der Zwischenzeit den Platzhalter). Bleibt
   getAsset() ausnahmsweise synchron (aeltere Fassung) oder wirft einen
   Fehler (Bild im Media-Library geloescht, Feld verweist noch drauf —
   kam bei den Produktfotos hier schon mehrfach vor), faengt es das
   ebenfalls ab, statt die komplette Vorschau abreissen zu lassen. */
function getInitialAssetState() {
  return { resolvedAssets: {} };
}

function resolveAsset(path) {
  if (!path) return null;
  if (Object.prototype.hasOwnProperty.call(this.state.resolvedAssets, path)) {
    return this.state.resolvedAssets[path];
  }
  var self = this;
  var result;
  try {
    result = this.props.getAsset(path);
  } catch (err) {
    return null;
  }
  if (result && typeof result.then === "function") {
    result.then(
      function (asset) {
        var url = asset && typeof asset.toString === "function" ? asset.toString() : (typeof asset === "string" ? asset : null);
        self.setState(function (prevState) {
          var next = {};
          next[path] = url || null;
          return { resolvedAssets: Object.assign({}, prevState.resolvedAssets, next) };
        });
      },
      function () {
        self.setState(function (prevState) {
          var next = {};
          next[path] = null;
          return { resolvedAssets: Object.assign({}, prevState.resolvedAssets, next) };
        });
      }
    );
    return null;
  }
  var syncUrl = result && typeof result.toString === "function" ? result.toString() : null;
  return syncUrl || null;
}

/* Kleine Zwischenueberschriften, damit im Vorschau-Panel klar ist, welcher
   Seitenbereich gerade gezeigt wird. */
var LABEL_STYLE = {
  margin: "0 0 8px",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "#8a9099"
};
var NOTE_STYLE = {
  margin: "0 0 28px",
  fontSize: "11px",
  lineHeight: 1.5,
  color: "#a4a9b0"
};

/* ---------- Produkt-Vorschau ---------- */
var ProductPreview = createClass({
  getInitialState: getInitialAssetState,
  resolveAsset: resolveAsset,
  render: function () {
    /* .toJS() statt .toObject(): .toObject() konvertiert nur die oberste
       Ebene von Immutable.js zu normalem JS — verschachtelte Felder wie
       "images" (eine Liste von Objekten) blieben dabei Immutable-Objekte,
       auf denen z.B. img.src immer undefined ist (Immutable-Maps geben
       Werte nur ueber .get("src") frei, nicht per Punktzugriff). Das war
       der eigentliche Grund, warum Karte und Detailseite nie zuverlaessig
       ein Bild zeigten, ganz unabhaengig vom getAsset-Promise-Thema.
       .toJS() konvertiert rekursiv, dann funktioniert der normale
       Punktzugriff ueberall. */
    var e = this.props.entry.get("data").toJS();
    /* images ist jetzt eine Liste von {src, zoom, moveX, moveY} statt reiner
       Pfade, wegen der Detailseiten-Regler pro Bild — deshalb .src. */
    var imageList = (e.images || []).filter(function (img) { return img && img.src; });
    var firstImage = imageList.length ? imageList[0].src : null;
    var imageUrl = this.resolveAsset(firstImage);
    /* Hero, Promo-Kachel und Karte haben getrennte Werte — drei
       unterschiedlich geformte Rahmen (breit, schmal-hoch, quadratisch),
       dieselben Zahlen wirken dort also jeweils anders. */
    function transformOf(zoomKey, moveXKey, moveYKey) {
      var z = e[zoomKey] !== undefined ? e[zoomKey] : 100;
      var x = e[moveXKey] !== undefined ? e[moveXKey] : 0;
      var y = e[moveYKey] !== undefined ? e[moveYKey] : 0;
      return "translate(" + x + "%, " + y + "%) scale(" + z / 100 + ")";
    }
    /* Gleiche Rechnung wie transformOf, aber pro Bildobjekt aus der Liste
       (eigene zoom/moveX/moveY je Foto) statt aus den Top-Level-Feldern. */
    function imgTransformStyle(img) {
      var z = img.zoom !== undefined ? img.zoom : 100;
      var x = img.moveX !== undefined ? img.moveX : 0;
      var y = img.moveY !== undefined ? img.moveY : 0;
      return { transform: "translate(" + x + "%, " + y + "%) scale(" + z / 100 + ")" };
    }
    var heroTransform = transformOf("heroZoom", "heroMoveX", "heroMoveY");
    var promoTransform = transformOf("promoZoom", "promoMoveX", "promoMoveY");
    var cardImgStyle = { transform: transformOf("cardZoom", "cardMoveX", "cardMoveY") };
    var heroTitle = e.heroTitle || e.title || "(kein Titel)";
    var heroImageRaw = e.heroImage || firstImage;
    var heroImageUrl = this.resolveAsset(heroImageRaw);
    var inCarousel = HERO_CAROUSEL_IDS.indexOf(e.id) !== -1;
    var inPromo = e.id === HERO_PROMO_ID;

    return h(
      "div",
      { style: { padding: "32px", background: "#fff", fontFamily: "Poppins, sans-serif" } },
      h("div", { dangerouslySetInnerHTML: { __html: ICON_SPRITE } }),

      /* ---- Hero-Karussell-Vorschau ----
         Gleiches Seitenverhaeltnis 3/2 wie .hero__main auf der echten Seite,
         damit der Zuschnitt hier so aussieht wie live. Nur fuer p1/p3/p6 —
         fuer alle anderen Produkte (inkl. p2, das steht in der Promo-Kachel
         statt im Karussell) macht dieser Block keinen Sinn, deshalb weg. */
      inCarousel
        ? h(
            "div",
            null,
            h("p", { style: LABEL_STYLE }, "Hero-Karussell (Startseite)"),
            h(
              "div",
              { className: "hero", style: { padding: 0, marginBottom: "8px" } },
              h(
                "article",
                {
                  className: "hero__main",
                  /* Seitenverhaeltnis hier hart setzen: das Vorschau-Panel ist
                     schmaler als der 900px-Breakpoint, sonst greift die
                     Mobil-Regel und der Zuschnitt waere ein anderer als live. */
                  style: { aspectRatio: "3 / 2", minHeight: 0 }
                },
                h(
                  "div",
                  { className: "hero__art" },
                  h(
                    "div",
                    { className: "hero__art-slide is-active" },
                    heroImageUrl
                      ? h("img", { src: heroImageUrl, alt: heroTitle, style: { transform: heroTransform } })
                      : h("svg", { className: "ph ph--hero" }, h("use", { href: "#" + (e.icon || "p-photo") })),
                    heroImageUrl && e.heroAiBadge
                      ? h("img", { className: "ai-badge", src: "/assets/icons/ai-badge.svg", alt: "KI-bearbeitetes Bild" })
                      : null
                  )
                ),
                h("div", { className: "hero__scrim" }),
                h(
                  "div",
                  { className: "hero__copy" },
                  h("p", { className: "hero__eyebrow" }, e.heroEyebrow || ""),
                  h("p", { className: "hero__title" }, heroTitle),
                  h("p", { className: "hero__meta" }, e.heroMeta || ""),
                  h(
                    "p",
                    { className: "hero__price" },
                    h("span", {}, "Ab"),
                    " " + (e.price || "0,00") + " €"
                  )
                )
              )
            ),
            h("p", { style: NOTE_STYLE }, "Nur sichtbar auf der Startseite, im Karussell-Wechsel mit den anderen Hero-Produkten.")
          )
        : null,

      /* ---- Promo-Kachel-Vorschau ----
         Schmal-hoher Rahmen neben dem Karussell, eigenes Bild-Feld-Set
         (promoZoom/promoMoveX/promoMoveY/promoAiBadge) — dieselben Werte
         wie oben im Karussell wuerden hier, in einem ganz anderen
         Seitenverhaeltnis, an einer anderen Stelle zuschneiden. Nur fuer
         das eine Produkt, das aktuell in index.njk als Promo-Kachel
         eingebunden ist. */
      inPromo
        ? h(
            "div",
            null,
            h("p", { style: LABEL_STYLE }, "Promo-Kachel (Startseite, neben dem Karussell)"),
            h(
              "aside",
              {
                className: "hero__promo" + (heroImageUrl ? " has-photo" : ""),
                /* 360px breit x ca. 515px hoch entspricht der Kachel live
                   neben dem 3/2-Karussell — eigenes Seitenverhaeltnis, weil
                   die Kachel hier nicht in einem echten Grid neben dem
                   Karussell steht und sonst keine Hoehe haette. */
                style: { width: "220px", aspectRatio: "360 / 515", marginBottom: "8px" }
              },
              h(
                "div",
                { className: "hero__promo-art" },
                heroImageUrl
                  ? h("img", { src: heroImageUrl, alt: heroTitle, style: { transform: promoTransform } })
                  : h("svg", { className: "ph ph--promo" }, h("use", { href: "#" + (e.icon || "p-photo") })),
                heroImageUrl && e.promoAiBadge
                  ? h("img", { className: "ai-badge", src: "/assets/icons/ai-badge.svg", alt: "KI-bearbeitetes Bild" })
                  : null
              ),
              heroImageUrl ? h("div", { className: "hero__promo-scrim" }) : null,
              h(
                "div",
                { className: "hero__promo-copy" },
                h("p", { className: "hero__eyebrow hero__eyebrow--dark" }, e.heroEyebrow || ""),
                h("h2", { className: "hero__promo-title" }, heroTitle),
                h("p", { className: "hero__meta hero__meta--dark" }, e.heroMeta || "")
              )
            ),
            h("p", { style: NOTE_STYLE }, "Nur sichtbar auf der Startseite, als feste Kachel neben dem Karussell (nutzt dasselbe Bild wie oben, aber eigenen Zuschnitt).")
          )
        : null,

      h("p", { style: LABEL_STYLE }, "Empfehlungen-Karte"),
      h(
        "article",
        { className: "product", style: { maxWidth: "280px" } },
        h(
          "div",
          { className: "product__media" },
          e.badge ? h("span", { className: "tagbadge" }, e.badge) : null,
          imageUrl
            ? h("img", { src: imageUrl, alt: e.title || "", style: cardImgStyle })
            : h(
                "svg",
                { className: "ph" },
                h("use", { href: "#" + (e.icon || "p-photo") })
              ),
          imageUrl && e.cardAiBadge
            ? h("img", { className: "ai-badge", src: "/assets/icons/ai-badge.svg", alt: "KI-bearbeitetes Bild" })
            : null
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
      ),

      /* ---- Detailseiten-Galerie-Vorschau ----
         Jedes Bild hat eigene Zoom/Verschieben-Werte fuer die Detailseite.
         Ohne diese Vorschau waeren genau diese Regler wieder blind, wie
         der Hero es vorher war — deshalb jedes Bild als eigene kleine
         .pd__media-Box mit seinem echten Zuschnitt, nicht nur das erste. */
      imageList.length
        ? h(
            "div",
            { style: { marginTop: "28px" } },
            h("p", { style: LABEL_STYLE }, "Produktfotos (Detailseite)"),
            h(
              "div",
              { style: { display: "flex", gap: "10px", flexWrap: "wrap" } },
              imageList.map(function (img, i) {
                var url = this.resolveAsset(img.src);
                var z = img.zoom !== undefined ? img.zoom : 100;
                var x = img.moveX !== undefined ? img.moveX : 0;
                var y = img.moveY !== undefined ? img.moveY : 0;
                return h(
                  "div",
                  { key: i, style: { width: "110px" } },
                  h(
                    "div",
                    { className: "pd__media", style: { width: "110px" } },
                    url
                      ? h("img", {
                          src: url,
                          alt: "",
                          style: { transform: "translate(" + x + "%, " + y + "%) scale(" + z / 100 + ")" }
                        })
                      : h("svg", { className: "ph" }, h("use", { href: "#" + (e.icon || "p-photo") })),
                    url && img.aiBadge
                      ? h("img", { className: "ai-badge", src: "/assets/icons/ai-badge.svg", alt: "KI-bearbeitetes Bild" })
                      : null
                  ),
                  h(
                    "p",
                    { style: { margin: "4px 0 0", fontSize: "10px", color: "#a4a9b0", textAlign: "center" } },
                    "Bild " + (i + 1) + (i === 0 ? " (Haupt)" : "")
                  )
                );
              }, this)
            ),
            h(
              "p",
              { style: NOTE_STYLE },
              "Nur sichtbar, wenn „Eigene Produktseite anlegen?“ weiter unten aktiv ist. Bild 1 ist zugleich das Hauptbild auf Karte und Hero-Fallback."
            )
          )
        : null,

      /* ---- Detailseiten-Vorschau (vollstaendiger Kopfbereich) ----
         Zeigt pd__grid so, wie er auf produkt.njk tatsaechlich steht:
         grosses Hauptbild + Miniaturen links, Titel/Lead/Preis/CTA
         rechts. Vorteile/Nachteile und "Das koennte dir auch gefallen"
         bleiben aussen vor — das sind eigene Sektionen, keine "Vorschau
         auf ein Bild", und wuerden das Panel nur unnoetig verlaengern. */
      e.hasDetailPage
        ? h(
            "div",
            { style: { marginTop: "28px" } },
            h("p", { style: LABEL_STYLE }, "Detailseite"),
            h(
              "div",
              { className: "pd__grid" },
              h(
                "div",
                { className: "pd__gallery" },
                h(
                  "div",
                  { className: "pd__media" },
                  imageUrl
                    ? h("img", { src: imageUrl, alt: e.title || "", style: imgTransformStyle(imageList[0]) })
                    : h("svg", { className: "ph" }, h("use", { href: "#" + (e.icon || "p-photo") })),
                  imageUrl && imageList.length && imageList[0].aiBadge
                    ? h("img", { className: "ai-badge", src: "/assets/icons/ai-badge.svg", alt: "KI-bearbeitetes Bild" })
                    : null
                ),
                imageList.length > 1
                  ? h(
                      "div",
                      { className: "pd__thumbs" },
                      imageList.map(function (img, i) {
                        var turl = this.resolveAsset(img.src);
                        return h(
                          "button",
                          { key: i, type: "button", className: "pd__thumb" + (i === 0 ? " is-active" : "") },
                          turl ? h("img", { src: turl, alt: "", style: imgTransformStyle(img) }) : null
                        );
                      }, this)
                    )
                  : null
              ),
              h(
                "div",
                { className: "pd__info" },
                h("p", { className: "pd__cat" }, catLabel(e.categoryKey)),
                h("h1", { className: "pd__title" }, e.title || "(kein Titel)"),
                e.lead ? h("p", { className: "pd__lead" }, e.lead) : null,
                h(
                  "p",
                  { className: "pd__pop pop" },
                  h("svg", { className: "ic ic--14" }, h("use", { href: "#i-click" })),
                  " " + deNumber(e.baseClicks) + " Klicks diesen Monat"
                ),
                h(
                  "p",
                  { className: "pd__price" },
                  e.oldPrice ? h("del", {}, "€ " + e.oldPrice) : null,
                  " € " + (e.price || "0,00")
                ),
                h("p", { className: "pd__price-note" }, "Preis kann abweichen · Stand " + (e.priceDate || "—")),
                h(
                  "div",
                  { className: "pd__actions" },
                  h("a", { className: "btn btn--primary", href: "#" }, "Zum Angebot bei Amazon"),
                  h(
                    "button",
                    { className: "wish pd__wish", type: "button" },
                    h("svg", { className: "ic ic--18" }, h("use", { href: "#i-heart" }))
                  )
                )
              )
            ),
            h(
              "p",
              { style: NOTE_STYLE },
              "Nur sichtbar, wenn „Eigene Produktseite anlegen?“ weiter unten aktiv ist. Vorteile/Nachteile und „Das könnte dir auch gefallen“ erscheinen nur auf der echten Seite, nicht hier."
            )
          )
        : null
    );
  }
});

/* ---------- Artikel-Vorschau ---------- */
var ArticlePreview = createClass({
  getInitialState: getInitialAssetState,
  resolveAsset: resolveAsset,
  render: function () {
    /* .toJS() statt .toObject(): .toObject() konvertiert nur die oberste
       Ebene von Immutable.js zu normalem JS — verschachtelte Felder wie
       "images" (eine Liste von Objekten) blieben dabei Immutable-Objekte,
       auf denen z.B. img.src immer undefined ist (Immutable-Maps geben
       Werte nur ueber .get("src") frei, nicht per Punktzugriff). Das war
       der eigentliche Grund, warum Karte und Detailseite nie zuverlaessig
       ein Bild zeigten, ganz unabhaengig vom getAsset-Promise-Thema.
       .toJS() konvertiert rekursiv, dann funktioniert der normale
       Punktzugriff ueberall. */
    var e = this.props.entry.get("data").toJS();
    var coverUrl = this.resolveAsset(e.coverImage);
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
