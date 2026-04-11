const { createElement: h } = window.React;

export function AppHeader({ meta }) {
  return h(
    "header",
    { className: "app-header" },
    h(
      "div",
      { className: "header-copy" },
      h("span", { className: "eyebrow" }, "DajeonStargram"),
      h("h1", null, meta.title)
    )
  );
}
