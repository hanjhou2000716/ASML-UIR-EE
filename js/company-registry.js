(() => {
  'use strict';
  const companies = {
    lam: { id: 'lam', name: 'Lam Research', shortName: 'Lam CE', role: 'Customer Engineer', status: 'active', icon: 'screwdriver-wrench', accent: 'navy', order: 1 },
    asml: { id: 'asml', name: 'ASML UIR', shortName: 'ASML UIR', role: 'Upgrade / Install / Relocation', status: 'active', icon: 'microchip', accent: 'navy', order: 2 },
    fstech: { id: 'fstech', name: '台塑勝高', shortName: '台塑勝高', role: '生產製程工程師', status: 'active', icon: 'chart-line', accent: 'sage', order: 3 },
    benq: { id: 'benq', name: '明基材料｜塗佈', shortName: '明基材料', role: '製程技術工程師', status: 'active', icon: 'layer-group', accent: 'sage', order: 4 },
    assembly: { id: 'assembly', name: 'ASML Assembly', shortName: 'ASML Assembly', role: 'Final Assembly', status: 'archived', icon: 'screwdriver-wrench', accent: 'navy', archivedOrder: 1 },
    micron: { id: 'micron', name: '美光', shortName: '美光', role: 'RDA 量測輪班工程師', status: 'archived', icon: 'layers', accent: 'slate', archivedOrder: 2 },
    swancor: { id: 'swancor', name: '上緯', shortName: '上緯', role: '設備 / 製程', status: 'archived', icon: 'layers', accent: 'slate', archivedOrder: 3 },
    skyeuv: { id: 'skyeuv', name: '天虹', shortName: '天虹', role: '機構工程師', status: 'archived', icon: 'layers', accent: 'slate', archivedOrder: 4 }
  };
  const ordered = (status) => Object.values(companies).filter(company => company.status === status).sort((a, b) => (a.order ?? a.archivedOrder) - (b.order ?? b.archivedOrder));
  window.CompanyRegistry = Object.freeze({
    schemaVersion: 1,
    companies: Object.freeze(companies),
    active: () => ordered('active'),
    archived: () => ordered('archived'),
    get: id => companies[id] || null,
    isActive: id => companies[id]?.status === 'active',
    isArchived: id => companies[id]?.status === 'archived'
  });
})();
