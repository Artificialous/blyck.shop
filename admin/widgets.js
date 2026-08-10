/* ============================================================
   BLYCK CMS — Eigenes "imageGallery"-Feld
   Ersetzt das native list+image-Feld durch eine Kachel-Übersicht:
   Bilder nebeneinander, pro Kachel Ersetzen/Löschen, Ziehen zum
   Umsortieren, "+"-Kachel zum Hinzufügen.

   Speichert weiterhin einfach ein Array aus Bild-Pfaden — gleiches
   Datenformat wie vorher, keine Änderung an den Templates nötig.

   Riskantester Teil: das Öffnen von Decaps eigener Mediathek aus
   einem eigenen Widget heraus (onOpenMediaLibrary/mediaPaths). Die
   Programmierschnittstelle dafür ist dokumentiert, aber ohne echten
   Login lässt sich das Zusammenspiel nicht vollständig lokal prüfen —
   falls "Ersetzen" oder "+" die Mediathek nicht korrekt öffnen oder
   das gewählte Bild nicht übernehmen, ist das die erste Stelle zum
   Nachjustieren.
   ============================================================ */

(function () {
  var STYLE = document.createElement('style');
  STYLE.textContent =
    '.gallery-widget{border:1px solid #dde0e3;border-radius:4px;padding:14px;background:#fafbfc}' +
    '.gallery-widget__hint{font-size:12px;color:#7a7f85;margin:0 0 12px}' +
    '.gallery-widget__grid{display:flex;flex-wrap:wrap;gap:14px}' +
    '.gallery-widget__card{width:180px;border:1px solid #dde0e3;border-radius:4px;background:#fff;padding:10px;cursor:grab}' +
    '.gallery-widget__card.is-dragging{opacity:.4}' +
    '.gallery-widget__thumb-wrap{position:relative;width:100%;aspect-ratio:1/1;background:repeating-conic-gradient(#e9e9e9 0% 25%,#fff 0% 50%) 50%/16px 16px;border-radius:3px;overflow:hidden;margin-bottom:10px}' +
    '.gallery-widget__thumb{width:100%;height:100%;object-fit:contain;display:block}' +
    '.gallery-widget__badge{position:absolute;top:6px;left:6px;background:#2277dd;color:#fff;font-size:10px;font-weight:600;padding:2px 6px;border-radius:3px}' +
    '.gallery-widget__actions{display:flex;flex-direction:column;gap:6px}' +
    '.gallery-widget__btn{border:0;border-radius:3px;padding:7px 10px;font-size:12px;cursor:pointer;text-align:left;background:#eaf2fb;color:#1b5faa}' +
    '.gallery-widget__btn:hover{background:#dbe9fa}' +
    '.gallery-widget__btn.is-danger{background:#fdeceb;color:#c0392b}' +
    '.gallery-widget__btn.is-danger:hover{background:#fbdedc}' +
    '.gallery-widget__add{width:180px;aspect-ratio:1/1;border:2px dashed #c7ccd1;border-radius:4px;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;color:#7a7f85;font-size:13px;cursor:pointer}' +
    '.gallery-widget__add:hover{border-color:#2277dd;color:#2277dd}' +
    '.gallery-widget__plus{font-size:28px;line-height:1}';
  document.head.appendChild(STYLE);

  function toArray(value) {
    if (!value) return [];
    if (typeof value.toJS === 'function') return value.toJS();
    if (Array.isArray(value)) return value;
    return [];
  }

  var GalleryControl = createClass({
    componentDidUpdate: function () {
      var mediaPaths = this.props.mediaPaths || {};
      if (this._pendingAddID && mediaPaths[this._pendingAddID]) {
        var addPath = mediaPaths[this._pendingAddID];
        var afterAdd = toArray(this.props.value).concat([addPath]);
        this.props.onChange(afterAdd);
        this.props.onRemoveInsertedMedia && this.props.onRemoveInsertedMedia(this._pendingAddID);
        this._pendingAddID = null;
      }
      if (this._pendingReplaceID && mediaPaths[this._pendingReplaceID]) {
        var replacePath = mediaPaths[this._pendingReplaceID];
        var afterReplace = toArray(this.props.value).slice();
        afterReplace[this._pendingReplaceIndex] = replacePath;
        this.props.onChange(afterReplace);
        this.props.onRemoveInsertedMedia && this.props.onRemoveInsertedMedia(this._pendingReplaceID);
        this._pendingReplaceID = null;
        this._pendingReplaceIndex = null;
      }
    },

    handleAdd: function () {
      var id = 'gallery_add_' + this.props.forID + '_' + Date.now();
      this._pendingAddID = id;
      this.props.onOpenMediaLibrary({
        controlID: id,
        forImage: true,
        allowMultiple: false,
        field: this.props.field
      });
    },

    handleReplace: function (index) {
      var id = 'gallery_replace_' + this.props.forID + '_' + index + '_' + Date.now();
      this._pendingReplaceID = id;
      this._pendingReplaceIndex = index;
      this.props.onOpenMediaLibrary({
        controlID: id,
        forImage: true,
        allowMultiple: false,
        field: this.props.field
      });
    },

    handleRemove: function (index) {
      var list = toArray(this.props.value).slice();
      list.splice(index, 1);
      this.props.onChange(list);
    },

    handleDragStart: function (index) {
      this._dragFrom = index;
      this.setState({ draggingIndex: index });
    },

    handleDragOver: function (ev) {
      ev.preventDefault();
    },

    handleDrop: function (index) {
      var from = this._dragFrom;
      this.setState({ draggingIndex: null });
      if (from === undefined || from === null || from === index) return;
      var list = toArray(this.props.value).slice();
      var moved = list.splice(from, 1)[0];
      list.splice(index, 0, moved);
      this.props.onChange(list);
      this._dragFrom = null;
    },

    resolveUrl: function (src) {
      if (this.props.getAsset) {
        var asset = this.props.getAsset(src);
        return asset ? asset.toString() : src;
      }
      return src;
    },

    getInitialState: function () {
      return { draggingIndex: null };
    },

    render: function () {
      var self = this;
      var list = toArray(this.props.value);

      return h(
        'div',
        { className: 'gallery-widget' },
        h(
          'p',
          { className: 'gallery-widget__hint' },
          'Erstes Bild = Hauptbild auf Karte und Detailseite. Ziehen zum Umsortieren. Kein Amazon-Bild hochladen — nur eigene Fotos oder unabhängig erzeugte KI-Bilder.'
        ),
        h(
          'div',
          { className: 'gallery-widget__grid' },
          list.map(function (src, i) {
            return h(
              'div',
              {
                key: src + i,
                className: 'gallery-widget__card' + (self.state.draggingIndex === i ? ' is-dragging' : ''),
                draggable: true,
                onDragStart: function () { self.handleDragStart(i); },
                onDragOver: self.handleDragOver,
                onDrop: function () { self.handleDrop(i); }
              },
              h(
                'div',
                { className: 'gallery-widget__thumb-wrap' },
                i === 0 ? h('span', { className: 'gallery-widget__badge' }, 'Hauptbild') : null,
                h('img', { className: 'gallery-widget__thumb', src: self.resolveUrl(src), alt: '' })
              ),
              h(
                'div',
                { className: 'gallery-widget__actions' },
                h('button', { type: 'button', className: 'gallery-widget__btn', onClick: function () { self.handleReplace(i); } }, 'Ersetzen'),
                h('button', { type: 'button', className: 'gallery-widget__btn is-danger', onClick: function () { self.handleRemove(i); } }, 'Löschen')
              )
            );
          }),
          h(
            'button',
            { type: 'button', className: 'gallery-widget__add', onClick: function () { self.handleAdd(); } },
            h('span', { className: 'gallery-widget__plus' }, '+'),
            h('span', {}, 'Bild hinzufügen')
          )
        )
      );
    }
  });

  var GalleryPreview = createClass({
    render: function () {
      return null;
    }
  });

  CMS.registerWidget('imageGallery', GalleryControl, GalleryPreview);
})();
