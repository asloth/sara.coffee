// Posters open their project in a dialog over the train instead of navigating away. The project
// page is fetched and its article lifted in; the address becomes the project's own URL, and closing
// (button, Escape, backdrop, or Back) returns the visitor to the same spot with focus on the poster.

export function startProjects(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-project-dialog]');
  const body = dialog?.querySelector<HTMLElement>('[data-project-body]');
  if (!dialog || !body || typeof dialog.showModal !== 'function') return; // plain links still work

  let opener: HTMLElement | null = null;
  let returnUrl = '';
  const cache = new Map<string, string>();

  const fetchDetail = async (href: string) => {
    if (!cache.has(href)) {
      const res = await fetch(href);
      if (!res.ok) throw new Error(String(res.status));
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const article = doc.querySelector('[data-project-detail]');
      if (!article) throw new Error('no detail');
      cache.set(href, article.outerHTML);
    }
    return cache.get(href)!;
  };

  const open = async (link: HTMLAnchorElement, push: boolean) => {
    const href = link.getAttribute('href')!;
    try {
      body.innerHTML = await fetchDetail(href);
    } catch {
      location.href = href; // network trouble: just go to the page
      return;
    }
    opener = link;
    returnUrl = location.pathname + location.search + location.hash;
    if (push) history.pushState({ project: href }, '', href);
    dialog.showModal();
  };

  const finishClose = () => {
    body.innerHTML = '';
    opener?.focus({ preventScroll: true });
    opener = null;
  };

  document.addEventListener('click', (e) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[data-project]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void open(link, true);
  });

  // clicking the backdrop (outside the sheet) closes
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  // any close (button, Escape, backdrop): put the address back, then return focus
  dialog.addEventListener('close', () => {
    if (history.state?.project) {
      document.documentElement.dataset.keepScroll = '1';
      history.back();
    } else if (returnUrl && location.pathname !== '/') history.replaceState(null, '', returnUrl);
    finishClose();
  });

  // Back while the dialog is open closes it; Forward to a project reopens it
  window.addEventListener('popstate', (e) => {
    const project = (e.state as { project?: string } | null)?.project;
    if (dialog.open && !project) {
      dialog.close();
    } else if (!dialog.open && project) {
      const link = document.querySelector<HTMLAnchorElement>(`a[data-project][href="${project}"]`);
      if (link) void open(link, false);
    }
  });
}
