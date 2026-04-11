const { createElement: h } = window.React;

export function FilterChips({ categories, activeFilter, onChange }) {
  return h(
    "section",
    { className: "filter-bar" },
    h(
      "div",
      { className: "filter-scroll" },
      ...categories.map((category) =>
        h(
          "button",
          {
            key: category.id,
            type: "button",
            className: `filter-chip ${activeFilter === category.id ? "active" : ""}`,
            style: { "--chip-tone": category.tone },
            onClick: () => onChange(category.id)
          },
          category.label
        )
      )
    )
  );
}
