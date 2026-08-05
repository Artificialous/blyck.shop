# BLYCK — Design-System v0.2

Art Direction für den Amazon-Affiliate-Blog. Stand: 4. August 2026.
Grundlage: `blyck-konzept-dokument.md`.
Referenz: [Iffiliate](https://iffiliate.modeltheme.com/) — Stil wird übernommen,
nicht neu interpretiert. Alle Werte unten sind aus dem Screenshot der
Referenzseite gemessen, nicht geschätzt.

---

## 1. Farbe (gemessen aus der Referenz)

| Rolle | Hex | Einsatz |
|---|---|---|
| Seitenhintergrund | `#FFFFFF` | alles, Standard |
| Band hell | `#F7F7F7` | Trust-Leiste, abgesetzte Bänder |
| Navy | `#232F3D` | Navigationsleiste |
| Navy Footer | `#283142` | Footer-Block |
| **Akzent-Orange** | `#ED8F12` | Buttons, Badges, Preise, aktive Tabs, Icons |
| Überschrift | `#1F1F1F` | Headlines, Produkttitel |
| Fließtext | `#777777` | Beschreibungen, Meta |
| Tag-Grau | `#9A9A9A` | Versal-Kategorie-Tags |
| Haarlinie | `#E5E5E5` | Trenner unter Sektionsköpfen |

**Das Orange macht alles.** In der Referenz gibt es exakt eine Akzentfarbe. Sie
trägt Buttons, Preise, Badges, aktive Filter und Icon-Akzente. Keine zweite
Akzentfarbe einführen — das ist die Klammer, die das dichte Raster
zusammenhält.

**Anmerkung zur Nähe an Amazon-Orange.** `#ED8F12` liegt dicht an `#FF9900`.
Das ist für einen Amazon-Partner branchenüblich und kein Markenproblem, solange
Logo und Wortmarke nicht anlehnen. Falls dir das zu nah ist: `#E8871A` kippt
merklich ins Rötliche und behält die Wirkung.

---

## 2. Typografie

**Poppins durchgehend.** Kein zweiter Font.

| Element | Schnitt | Charakter |
|---|---|---|
| Sektionsüberschrift | SemiBold | moderat groß, nicht dominant |
| Produkttitel | Medium | max. 2 Zeilen |
| Fließtext | Regular, klein | 3-4 Zeilen Beschreibung pro Karte |
| Kategorie-Tag | Regular, Versalien, gesperrt | sehr klein, grau |
| Preis | Bold, orange | Alt-Preis grau durchgestrichen davor |
| Button-Label | SemiBold, Versalien, gesperrt | sehr klein, weiß |

Wichtig: die Überschriften sind bewusst **klein**. Das Layout lebt vom Raster
und der Produktdichte, nicht von Typo-Größe.

---

## 3. Layoutregeln

- Zentrierter Container, ca. 1200px.
- **Produktkacheln haben keinen Rahmen, keinen Hintergrund, keinen Schatten.**
  Die Produkte stehen frei auf Weiß. Das ist das prägendste Detail der Referenz
  und wird am häufigsten falsch nachgebaut.
- Sektionskopf: entweder zentriert mit durchlaufender Haarlinie auf
  Grundlinienhöhe, oder links mit Filter-Tabs/Link rechts und Haarlinie darunter.
- Buttons und Badges: 3px Radius, sonst rechteckig.
- Icons: dünne graue Outline-Linien, kein Fill.
- Produktfotos freigestellt auf Weiß.
- Raster: 5 Spalten bei Empfehlungen, 6 bei Reihen mit eingeschobener Promo-Kachel.

---

## 4. Abweichungen von der Referenz (aus dem Konzept)

| Referenz | BLYCK | Grund |
|---|---|---|
| Warenkorb-Icon + Summe | **Herz-Icon „Merkliste"** + Zähler | kein Checkout |
| „In den Warenkorb" + „Compare" | **ein Button „ZUM ANGEBOT"** | externer Amazon-Link |
| Sterne-Bewertung | **Beliebtheitswert: „1.284 Klicks"** | PA-API erst nach 3 Sales verfügbar |
| „SALE!"-Badge | **„TIPP"-Badge** | keine eigene Preishoheit |
| Preis allein | Preis + `Stand 04.08.2026` | keine Live-Sync ohne PA-API |
| — | Zeile `Werbung · Enthält Affiliate-Links` | Kennzeichnungspflicht |

Der Beliebtheitswert sitzt exakt an der Stelle, an der die Referenz die Sterne
zeigt — gleiche Position, gleiche Farbe, gleiche optische Funktion. Dadurch
bleibt das Raster identisch lesbar, obwohl die Datenquelle eine andere ist.

---

## 5. Startseite — 7 Sektionen

| # | Sektion | Aufbau |
|---|---|---|
| 1 | Header + Hero | weiße Kopfzeile mit Suche und Merkliste, Navy-Navileiste, Hero 70/30 |
| 2 | Trust-Leiste + Kategorien | graues Band mit 4 Icon-Punkten, darunter 8 Kategorie-Icons |
| 3 | Promo-Kacheln | 3 Kacheln, Foto links, Farbfeld rechts, oranger Button |
| 4 | Handverlesene Empfehlungen | 5 Produktspalten, rahmenlos auf Weiß |
| 5 | Meistgeklickt | Kopf links, Filter-Tabs rechts, 5 Produkte mit Rang-Badge + orange Promo-Kachel |
| 6 | Neueste Artikel | 3 Artikelkarten mit weißem Datums-Badge über dem Bild |
| 7 | Footer | Navy, 4 Spalten, Newsletter mit orangem Senden-Button, Bottombar |

---

## 6. Komponenten

### Produktkachel
Rahmenlos auf Weiß, von oben:
1. Produktfoto freigestellt, Herz-Outline oben rechts, optional `TIPP`-Badge oben links
2. Kategorie-Tag, Versalien, klein, grau
3. Produkttitel, max. 2 Zeilen
4. 3 Zeilen Beschreibung, grau
5. **Beliebtheitswert:** Cursor-Icon + `1.284 Klicks`, orange, fett
6. Preis orange fett, ggf. Alt-Preis grau durchgestrichen davor
7. Kleinzeile `Preis kann abweichen · Stand [Datum]`
8. Oranger Button `ZUM ANGEBOT`

### Kategorien-Leiste
8 Outline-Icons in einer Reihe. Die zwei befüllten Kategorien dunkel und aktiv
mit oranger Zähler-Pille (`24`, `16`), die übrigen sechs ausgegraut auf
`#C4C4C4` mit Kleinzeile `Bald verfügbar`.

### Artikelkarte
Bild volle Kartenbreite, weißes Datums-Quadrat oben links überlappend (Tag groß
fett, Monat/Jahr klein), darunter Kategorie-Tag, Titel SemiBold, zwei Zeilen
Anriss, oranger Button `WEITERLESEN`.

---

## 7. Rechtliche Elemente im Layout

- `Werbung · Enthält Affiliate-Links` unter jedem Produktraster, im Hero, und
  am Anfang jedes Artikels.
- `Preis kann abweichen · Stand [Datum]` fest in jeder Produktkachel.
- Footer-Spalte „Rechtliches": Impressum, Datenschutzerklärung,
  Cookie-Einstellungen, Kontakt.
- Footer-Bottombar: `Als Amazon-Partner verdienen wir an qualifizierten Verkäufen.`
- Amazon-Produktbilder ohne PA-API-Lizenz nicht selbst hosten. Die Fotos in den
  Entwürfen sind Platzhalter für eigene Aufnahmen.

---

## 8. Content-Annahme (änderbar)

Startkategorien: **Arbeitsplatz** und **Kaffee & Küche**.
Platzhalter: Licht, Audio, Werkzeug, Ordnung, Reise, Pflege.
Bei anderer Nische ändern sich nur Fotografie und Labels — Farbe, Typo, Raster
und Komponenten bleiben.

---

## 9. Offen

- Nische bestätigen oder tauschen
- Wortmarke BLYCK gestalten (in den Entwürfen nur als Poppins-Schriftzug gesetzt)
- Orange final: `#ED8F12` wie Referenz, oder `#E8871A` mit Abstand zu Amazon
- Poppins ist über Google Fonts frei — keine Lizenzkosten
- Hosting und Domain (blyck.shop)
