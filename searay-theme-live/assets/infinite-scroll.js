(function () {
  console.log("[InfiniteScroll] loaded");

  let io = null;
  let onScroll = null;
  let mo = null;

  function cleanup() {
    if (io) {
      io.disconnect();
      io = null;
    }
    if (onScroll) {
      window.removeEventListener("scroll", onScroll);
      onScroll = null;
    }
  }

  function resolveList(appendSelector) {
    const el = document.querySelector(appendSelector);
    if (!el) return null;

    // If selector points to UL, good
    if (el.tagName === "UL" || el.tagName === "OL") return el;

    // If selector points to a container, find the UL inside
    return el.querySelector("ul.product-grid") || el.querySelector("ul.grid") || null;
  }

  function init() {
    cleanup();

    const sentinel = document.getElementById("InfiniteScroll");
    if (!sentinel) return console.log("[InfiniteScroll] no sentinel");

    const appendSelector = sentinel.dataset.appendSelector || "#product-grid ul.product-grid";
    const list = resolveList(appendSelector);
    if (!list) return console.log("[InfiniteScroll] no list", appendSelector);

    let nextUrl = sentinel.dataset.nextUrl || null;
    let loading = false;

    console.log("[InfiniteScroll] init", { nextUrl, appendSelector });

    async function loadNext() {
      // Re-read nextUrl every time (because facets replace HTML)
      nextUrl = document.getElementById("InfiniteScroll")?.dataset?.nextUrl || nextUrl;

      if (!nextUrl || loading) return;
      loading = true;

      console.log("[InfiniteScroll] loading", nextUrl);

      try {
        const html = await (await fetch(nextUrl)).text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        const nextSentinel = doc.getElementById("InfiniteScroll");
        const nextAppendSelector =
          nextSentinel?.dataset?.appendSelector || appendSelector;

        const nextList = (function () {
          const el = doc.querySelector(nextAppendSelector);
          if (!el) return null;
          if (el.tagName === "UL" || el.tagName === "OL") return el;
          return el.querySelector("ul.product-grid") || el.querySelector("ul.grid") || null;
        })();

        if (!nextList) {
          console.log("[InfiniteScroll] next list not found");
          document.getElementById("InfiniteScroll").dataset.nextUrl = "";
          return;
        }

        const items = nextList.querySelectorAll("li.grid__item");
        console.log("[InfiniteScroll] appending", items.length);
        items.forEach((li) => list.appendChild(li));

        const newNextUrl = nextSentinel?.dataset?.nextUrl || "";
        document.getElementById("InfiniteScroll").dataset.nextUrl = newNextUrl;

        console.log("[InfiniteScroll] nextUrl ->", newNextUrl);
      } catch (e) {
        console.error("[InfiniteScroll] error", e);
      } finally {
        loading = false;
      }
    }

    io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && loadNext(),
      { rootMargin: "1200px 0px" }
    );
    io.observe(sentinel);

    onScroll = () => {
      const remaining =
        document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (remaining < 1200) loadNext();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function bindMutationObserver() {
    const container = document.getElementById("ProductGridContainer");
    if (!container) return;

    if (mo) mo.disconnect();
    mo = new MutationObserver(() => {
      // Dawn swapped grid HTML -> re-init with new sentinel & new list
      setTimeout(init, 0);
    });
    mo.observe(container, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
      bindMutationObserver();
    });
  } else {
    init();
    bindMutationObserver();
  }

  // Also handle Dawn event (when it fires)
  document.addEventListener("facet-filters-form:render", () => setTimeout(init, 0));
})();
