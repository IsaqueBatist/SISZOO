// SISZOO — shared icon helpers (exposed on window)
window.SISZOO_ICONS = (function() {
  function svg(d, opts) {
    opts = opts || {};
    const sw = opts.sw || 2;
    const size = opts.size || 18;
    const fill = opts.fill || 'none';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }
  return {
    paw: (s) => `<svg width="${s||18}" height="${s||18}" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="9" r="2"/><circle cx="10" cy="5" r="2"/><circle cx="14" cy="5" r="2"/><circle cx="18" cy="9" r="2"/><path d="M12 11c-3 0-5 2.5-5 5 0 2 1.5 3 3 3 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-1 3-3 0-2.5-2-5-5-5z"/></svg>`,
    syringe: (s) => svg('<path d="M14 3l7 7"/><path d="M16 5l-9 9 3 3 9-9"/><path d="M10 17l-4 4"/><path d="M6 13l4 4"/>', {size:s}),
    heart: (s) => svg('<path d="M12 21s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 6 14.5 5 16.5 5 20 5 22.5 8.5 21 12c-2 4.5-9 9-9 9z"/>', {size:s, fill: 'currentColor'}),
    chip: (s) => svg('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9z"/><line x1="3" y1="9" x2="5" y2="9"/><line x1="3" y1="15" x2="5" y2="15"/><line x1="19" y1="9" x2="21" y2="9"/><line x1="19" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="5"/><line x1="15" y1="3" x2="15" y2="5"/><line x1="9" y1="19" x2="9" y2="21"/><line x1="15" y1="19" x2="15" y2="21"/>', {size:s}),
    alert: (s) => svg('<path d="M12 3 2 21h20L12 3z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17.5" r="0.5" fill="currentColor"/>', {size:s}),
    bell: (s) => svg('<path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z"/><path d="M10 21a2 2 0 0 0 4 0"/>', {size:s}),
    check: (s) => svg('<polyline points="20 6 9 17 4 12"/>', {size:s}),
    plus: (s) => svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', {size:s}),
    edit: (s) => svg('<path d="M4 20h4l10-10-4-4L4 16v4z"/><line x1="14" y1="6" x2="18" y2="10"/>', {size:s}),
    eye: (s) => svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', {size:s}),
    trash: (s) => svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>', {size:s}),
    download: (s) => svg('<path d="M12 4v12"/><polyline points="7 11 12 16 17 11"/><line x1="4" y1="20" x2="20" y2="20"/>', {size:s}),
    filter: (s) => svg('<polygon points="4 4 20 4 14 12 14 19 10 21 10 12 4 4"/>', {size:s}),
    search: (s) => svg('<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="20" y2="20"/>', {size:s}),
    map: (s) => svg('<polygon points="3 6 9 4 15 6 21 4 21 18 15 20 9 18 3 20 3 6"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/>', {size:s}),
    pill: (s) => svg('<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-30 12 12)"/><line x1="9" y1="9" x2="15" y2="15" transform="rotate(-30 12 12)"/>', {size:s}),
    flask: (s) => svg('<path d="M9 3h6v5l4 9a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l4-9V3z"/><line x1="10" y1="3" x2="14" y2="3"/>', {size:s}),
    fileText: (s) => svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><polyline points="14 3 14 8 19 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/>', {size:s}),
    camera: (s) => svg('<path d="M5 7h3l2-2h4l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3.5"/>', {size:s}),
    mail: (s) => svg('<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>', {size:s}),
    lock: (s) => svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', {size:s}),
    phone: (s) => svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', {size:s}),
    user: (s) => svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>', {size:s}),
    calendar: (s) => svg('<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>', {size:s}),
    arrowRight: (s) => svg('<line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/>', {size:s}),
    arrowLeft: (s) => svg('<line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 6 4 12 10 18"/>', {size:s}),
    home: (s) => svg('<path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/>', {size:s}),
    inbox: (s) => svg('<path d="M3 12l4-8h10l4 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/><path d="M3 12h5l1 3h6l1-3h5"/>', {size:s}),
    x: (s) => svg('<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>', {size:s}),
    bat: (s) => svg('<path d="M12 6c-2 0-3 1-4 3-2-1-4-1-5 0 1 2 3 3 4 4-2 1-3 3-3 5l4-1 1 2 3-2 3 2 1-2 4 1c0-2-1-4-3-5 1-1 3-2 4-4-1-1-3-1-5 0-1-2-2-3-4-3z"/>', {size:s}),
    cat: (s) => svg('<path d="M5 6l2 4a5 5 0 0 1 10 0l2-4-2 6 1 6c0 1-2 2-6 2s-6-1-6-2l1-6-2-6z"/><circle cx="10" cy="13" r="0.6" fill="currentColor"/><circle cx="14" cy="13" r="0.6" fill="currentColor"/>', {size:s}),
    dog: (s) => svg('<path d="M5 8l-1 4 1 6h3l1-3h6l1 3h3l1-6-1-4-3 1-3-1h-4l-3-1-1 1z"/><circle cx="10" cy="11" r="0.6" fill="currentColor"/><circle cx="14" cy="11" r="0.6" fill="currentColor"/>', {size:s}),
    moreV: (s) => svg('<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>', {size:s}),
    scissors: (s) => svg('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8" y2="16"/><line x1="20" y1="20" x2="14" y2="14"/>', {size:s}),
    upload: (s) => svg('<path d="M12 18V8"/><polyline points="7 13 12 8 17 13"/><line x1="4" y1="20" x2="20" y2="20"/>', {size:s}),
    pin: (s) => svg('<path d="M12 21s-6-7-6-12a6 6 0 0 1 12 0c0 5-6 12-6 12z"/><circle cx="12" cy="9" r="2.5"/>', {size:s}),
    flag: (s) => svg('<line x1="5" y1="3" x2="5" y2="21"/><path d="M5 4h12l-2 4 2 4H5"/>', {size:s}),
    arrowUp: (s) => svg('<line x1="12" y1="20" x2="12" y2="4"/><polyline points="6 10 12 4 18 10"/>', {size:s}),
    arrowDown: (s) => svg('<line x1="12" y1="4" x2="12" y2="20"/><polyline points="6 14 12 20 18 14"/>', {size:s}),
  };
})();
