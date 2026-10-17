document.querySelectorAll('[data-abb]').forEach((table) => {
  const body = table.tBodies[0];
  const heads = [...table.tHead.rows[0].cells];
  heads.forEach((th, idx) => {
    th.querySelector('button')?.addEventListener('click', () => {
      const desc = th.getAttribute('aria-sort') !== 'descending';
      heads.forEach((h) => h.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', desc ? 'descending' : 'ascending');
      const rows = [...body.rows];
      rows.sort((a, b) => {
        const x = a.cells[idx].dataset.v ?? '';
        const y = b.cells[idx].dataset.v ?? '';
        if (idx === 0) return desc ? y.localeCompare(x) : x.localeCompare(y);
        if (x === '' && y === '') return 0;
        if (x === '') return 1;
        if (y === '') return -1;
        return desc ? Number(y) - Number(x) : Number(x) - Number(y);
      });
      rows.forEach((r) => body.appendChild(r));
    });
  });
});
