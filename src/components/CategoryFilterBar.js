export function createCategoryFilterBar(state, actions) {
  const wrapper = document.createElement("div");
  wrapper.className = "filter-bar";

  wrapper.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="section-kicker">Category view</p>
        <h2>지금은 어떤 후보를 보고 싶나요?</h2>
      </div>
    </div>
    <div class="chip-row">
      ${state.categories
        .map(
          (category) => `
            <button
              type="button"
              class="filter-chip ${state.selectedCategory === category.id ? "is-active" : ""}"
              data-category="${category.id}"
              style="--chip-accent: ${category.color}"
            >
              ${category.label}
            </button>
          `
        )
        .join("")}
    </div>
  `;

  wrapper.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      actions.setCategory(button.dataset.category);
    });
  });

  return wrapper;
}
