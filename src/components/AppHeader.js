const { createElement: h } = window.React;

export function AppHeader({ meta }) {
  return h(
    "header",
    { className: "app-header" },
    h(
      "div",
      { className: "header-copy" },
      h("span", { className: "eyebrow" }, "DajeonStargram"),
      h(
        "div",
        { className: "header-title-row" },
        h(
          "span",
          { className: "header-parody-mark", "aria-hidden": "true" },
          h("span", { className: "header-parody-emoji" }, "🥖")
        ),
        h("h1", null, meta.title)
      )
    )
  );
}
