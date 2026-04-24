const { createElement: h, useState } = window.React;

export function AppHeader({ meta, searchQuery = "", onSearchChange, onOpenAdd }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const shouldShowSearch = isSearchOpen || Boolean(searchQuery);

  function handleSearchInput(event) {
    onSearchChange?.(event.target.value);
  }

  function handleClearSearch() {
    onSearchChange?.("");
    setIsSearchOpen(false);
  }

  function handleToggleSearch() {
    if (shouldShowSearch) {
      handleClearSearch();
      return;
    }

    setIsSearchOpen(true);
  }

  return h(
    "header",
    { className: "app-header" },
    h(
      "div",
      { className: "header-copy" },
      h(
        "div",
        { className: "header-topbar" },
        h(
          "div",
          { className: "header-title-stack" },
          h(
            "div",
            { className: "header-title-row" },
            h(
              "h1",
              null,
              h("span", null, "송포레 "),
              h("strong", null, String(meta.title || "대전 여행").replace(/^송포레\s*/, ""))
            )
          ),
          h("p", null, "친구들과 함께 고른 대전 핫플")
        ),
        h(
          "div",
          { className: "header-actions", "aria-label": "빠른 메뉴" },
          h(
            "button",
            {
              type: "button",
              className: `header-icon-button ${shouldShowSearch ? "active" : ""}`,
              "aria-label": "검색",
              onClick: handleToggleSearch
            },
            h("span", { className: "header-search-icon", "aria-hidden": "true" }, "⌕"),
            h("span", null, "검색")
          ),
          h(
            "button",
            {
              type: "button",
              className: "header-add-pill-button",
              "aria-label": "장소 추천",
              onClick: onOpenAdd
            },
            "+ 장소 추천"
          )
        )
      ),
      shouldShowSearch
        ? h(
            "label",
            { className: "header-search-field" },
            h("span", { className: "sr-only" }, "장소 검색"),
            h("input", {
              type: "text",
              value: searchQuery,
              placeholder: "장소명 또는 주소 검색",
              autoFocus: true,
              onInput: handleSearchInput
            }),
            searchQuery
              ? h(
                  "button",
                  {
                    type: "button",
                    className: "header-search-clear",
                    "aria-label": "검색어 지우기",
                    onClick: handleClearSearch
                  },
                  "×"
                )
              : null
          )
        : null
      )
    );
}
