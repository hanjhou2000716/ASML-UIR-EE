(() => {
  'use strict';
  const PATHS = {
    search: '<circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path>',
    random: '<path d="M3 7h4c4 0 5 10 9 10h5"></path><path d="m18 14 3 3-3 3"></path><path d="M3 17h4c1.7 0 2.8-1.8 3.8-3.7"></path><path d="M18 4l3 3-3 3"></path>',
    layers: '<path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"></path><path d="m4 12 8 4.5 8-4.5"></path><path d="m4 16 8 4.5 8-4.5"></path>',
    microchip: '<rect x="6" y="6" width="12" height="12" rx="2"></rect><path d="M9 1v5M15 1v5M9 18v5M15 18v5M1 9h5M18 9h5M1 15h5M18 15h5"></path>',
    assembly: '<path d="m14.5 6.5 3-3a2.1 2.1 0 0 1 3 3l-3 3"></path><path d="m13 8-8.5 8.5a2.1 2.1 0 1 0 3 3L16 11"></path><path d="m11 10 3 3M4 21l-1 1M7 18l-1 1"></path>',
    chart: '<path d="M4 19V5M4 19h17"></path><path d="m7 15 3-4 3 2 5-7"></path>',
    script: '<path d="M5 3h10l4 4v14H5z"></path><path d="M15 3v5h4M8 13h8M8 17h6"></path>',
    wrench: '<path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18a2.1 2.1 0 1 0 3 3l5.3-5.3a5 5 0 0 0 6.4-6.4l-3 3-3-1-1-3 3-3Z"></path>',
    product: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"></path><path d="m4 7.5 8 4.5 8-4.5M12 12v9"></path>',
    motivation: '<path d="M20.8 8.7c0 5.2-8.8 11.3-8.8 11.3S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"></path>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"></path>',
    shield: '<path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z"></path><path d="m8.5 12 2.3 2.3 4.7-5"></path>',
    combat: '<path d="m14 3 7 7-4 4-7-7 4-4Z"></path><path d="m10 7-7 7M7 17l-4 4M14 14l-4 4M18 10l-4 4"></path>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"></path>',
    timer: '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 1.5M9 3h6M12 3V1"></path>',
    volume: '<path d="M4 10v6h4l5 4V6l-5 4H4Z"></path><path d="M17 9a5 5 0 0 1 0 8M19.5 6.5a9 9 0 0 1 0 13"></path>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1"></rect>',
    check: '<path d="m5 12 4 4L19 6"></path>',
    chevron: '<path d="m6 9 6 6 6-6"></path>',
    arrowUp: '<path d="m6 14 6-6 6 6M12 8v12"></path>',
    close: '<path d="m6 6 12 12M18 6 6 18"></path>',
    archive: '<path d="M4 7h16v13H4zM3 4h18v3H3zM9 11h6"></path>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect>'
  };
  const render = (name, options = {}) => {
    const path = PATHS[name] || PATHS.grid;
    const size = options.size || 'md';
    const label = options.label ? ` role="img" aria-label="${String(options.label).replace(/[&<>"']/g, '')}"` : ' aria-hidden="true"';
    return `<svg class="app-icon app-icon-${size}${options.className ? ` ${options.className}` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"${label}>${path}</svg>`;
  };
  const fromClass = className => render(className || 'grid');
  const resolveName = node => node.dataset.icon || null;
  const hydrate = (root = document) => {
    root.querySelectorAll('[data-icon]').forEach(node => {
      const name = resolveName(node);
      if (!name) return;
      const svg = document.createElement('span');
      const className = [...node.classList].filter(className => className !== 'app-icon').join(' ');
      svg.innerHTML = render(name, { className });
      node.replaceWith(svg.firstElementChild);
    });
  };
  window.AppIcons = Object.freeze({ render, fromClass, hydrate, names: Object.freeze(Object.keys(PATHS)) });
})();
