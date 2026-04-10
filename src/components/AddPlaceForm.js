import { searchPlaceCandidates } from "../lib/api.js";

const CATEGORY_OPTIONS = [
  { value: "restaurant", label: "식당" },
  { value: "cafe", label: "카페" },
  { value: "shopping", label: "쇼핑" },
  { value: "tour", label: "관광지" },
  { value: "stay", label: "숙소" },
  { value: "etc", label: "기타" }
];

function renderSuggestions(target, suggestions, onSelect) {
  if (suggestions.length === 0) {
    target.innerHTML =
      '<p class="form-help-note">검색 결과가 없어요. 다른 장소명이나 주소로 다시 시도해 주세요.</p>';
    return;
  }

  target.innerHTML = `
    <div class="suggestion-list">
      ${suggestions
        .map(
          (item) => `
            <button type="button" class="suggestion-item" data-suggestion-id="${item.id}">
              <strong>${item.name}</strong>
              <span>${item.address}</span>
              <span>${[item.category, item.distanceLabel].filter(Boolean).join(" · ")}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;

  target.querySelectorAll("[data-suggestion-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = suggestions.find((item) => item.id === button.dataset.suggestionId);
      if (selected) {
        onSelect(selected);
      }
    });
  });
}

function renderSelectedLocation(target, selectedLocation) {
  if (!selectedLocation) {
    target.innerHTML = "";
    return;
  }

  target.innerHTML = `
    <div class="selected-location-chip">
      <strong>선택된 위치</strong>
      <span>${selectedLocation.name}</span>
      <span>${selectedLocation.address}</span>
    </div>
  `;
}

function formatDistanceLabel(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) {
    return "";
  }

  if (distanceMeters < 1000) {
    return `중앙로역 기준 약 ${Math.round(distanceMeters)}m`;
  }

  return `중앙로역 기준 약 ${(distanceMeters / 1000).toFixed(1)}km`;
}

export function createAddPlaceForm(state, actions) {
  const wrapper = document.createElement("div");
  wrapper.className = "add-place-panel";

  wrapper.innerHTML = `
    <div class="section-heading section-heading-inline">
      <div>
        <p class="section-kicker">New suggestion</p>
        <h2>여기에 바로 새 후보를 올릴 수 있어요</h2>
      </div>
      <button class="ghost-button" type="button" data-action="toggle-form">
        ${state.isAddFormOpen ? "폼 접기" : "장소 추가"}
      </button>
    </div>
    <div class="form-collapse ${state.isAddFormOpen ? "is-open" : ""}">
      <form class="place-form">
        <div class="form-grid">
          <label>
            <span>카테고리</span>
            <select name="category">
              ${CATEGORY_OPTIONS.map(
                (option) => `<option value="${option.value}">${option.label}</option>`
              ).join("")}
            </select>
          </label>
          <label>
            <span>현재 작성자</span>
            <input type="text" value="${state.nickname || "닉네임을 먼저 입력해 주세요"}" disabled />
          </label>
          <label class="form-span-2">
            <span>장소명</span>
            <input name="name" type="text" placeholder="예: 성심당 DCC점" required />
          </label>
          <label class="form-span-2">
            <span>장소 검색</span>
            <div class="address-search-stack">
              <div class="address-search-row">
                <input
                  name="address"
                  type="text"
                  placeholder="예: 성심당, 한밭수목원, 중앙로역"
                  required
                />
                <button class="ghost-button" type="button" data-action="search-address">
                  장소 찾기
                </button>
              </div>
              <div data-slot="selected-location"></div>
              <div data-slot="suggestions"></div>
            </div>
          </label>
          <label class="form-span-2">
            <span>한 줄 메모</span>
            <textarea
              name="description"
              rows="3"
              placeholder="왜 가고 싶은지 짧게 적어 주세요"
            ></textarea>
          </label>
        </div>
        <p class="form-caption">
          중앙로역을 기준으로 대전 근처 후보를 먼저 보여드려요. 하나를 고르면 이름과 주소가 자동으로 채워집니다.
        </p>
        <button class="primary-button" type="submit" ${state.isSavingPlace ? "disabled" : ""}>
          ${state.isSavingPlace ? "장소 저장 중..." : "장소 올리기"}
        </button>
      </form>
    </div>
  `;

  let selectedLocation = null;
  const form = wrapper.querySelector("form");
  const nameInput = form.querySelector('input[name="name"]');
  const addressInput = form.querySelector('input[name="address"]');
  const suggestionsSlot = wrapper.querySelector('[data-slot="suggestions"]');
  const selectedLocationSlot = wrapper.querySelector('[data-slot="selected-location"]');
  const searchButton = wrapper.querySelector('[data-action="search-address"]');

  const selectLocation = (location) => {
    selectedLocation = location;
    nameInput.value = location.name;
    addressInput.value = location.address;
    renderSelectedLocation(selectedLocationSlot, selectedLocation);
    suggestionsSlot.innerHTML = "";
  };

  const runSearch = async () => {
    const query = addressInput.value.trim();

    if (!query) {
      suggestionsSlot.innerHTML =
        '<p class="form-help-note">먼저 장소명이나 주소를 입력해 주세요.</p>';
      return [];
    }

    suggestionsSlot.innerHTML =
      '<p class="form-help-note">중앙로역 기준으로 대전 근처 후보를 찾는 중입니다...</p>';

    try {
      const payload = await searchPlaceCandidates(query);
      const suggestions = (payload.suggestions || []).map((item) => ({
        ...item,
        distanceLabel: formatDistanceLabel(item.distanceMeters)
      }));
      renderSuggestions(suggestionsSlot, suggestions, selectLocation);
      return suggestions;
    } catch (error) {
      suggestionsSlot.innerHTML = `
        <p class="form-help-note">
          ${error instanceof Error ? error.message : "장소 검색에 실패했습니다."}
        </p>
      `;
      return [];
    }
  };

  wrapper
    .querySelector('[data-action="toggle-form"]')
    .addEventListener("click", actions.toggleAddForm);

  searchButton.addEventListener("click", runSearch);

  addressInput.addEventListener("input", () => {
    selectedLocation = null;
    renderSelectedLocation(selectedLocationSlot, null);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!selectedLocation && state.runtimeConfig.naverMapsClientId) {
      const suggestions = await runSearch();

      if (suggestions.length === 1) {
        selectLocation(suggestions[0]);
      } else if (suggestions.length > 1) {
        window.alert("주소 후보가 여러 개라서 먼저 하나를 선택해 주세요.");
        return;
      }
    }

    actions.addPlace({
      category: String(formData.get("category") || "etc"),
      name: String(formData.get("name") || selectedLocation?.name || ""),
      address: String(formData.get("address") || selectedLocation?.address || ""),
      description: String(formData.get("description") || ""),
      latitude: selectedLocation?.latitude,
      longitude: selectedLocation?.longitude,
      resolvedAddress: selectedLocation?.address || ""
    });
  });

  return wrapper;
}
