import { searchPlaceCandidates } from "../lib/api.js";
import { loadNaverMapsSdk } from "../lib/naverMaps.js";

const CATEGORY_OPTIONS = [
  { value: "restaurant", label: "식당" },
  { value: "cafe", label: "카페" },
  { value: "shopping", label: "쇼핑" },
  { value: "tour", label: "관광지" },
  { value: "stay", label: "숙소" },
  { value: "etc", label: "기타" }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildMapSearchUrl(location) {
  const query = [location?.name, location?.address].filter(Boolean).join(" ");
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

function getDetailUrl(location) {
  const link = String(location?.link || "").trim();
  return /^https?:\/\//i.test(link) ? link : buildMapSearchUrl(location);
}

function getDistanceLabel(distanceMeters) {
  if (!Number.isFinite(distanceMeters)) {
    return "";
  }

  if (distanceMeters < 1000) {
    return `중앙로역 기준 약 ${Math.round(distanceMeters)}m`;
  }

  return `중앙로역 기준 약 ${(distanceMeters / 1000).toFixed(1)}km`;
}

async function renderPreviewMap(host, location, clientId) {
  if (!host) {
    return;
  }

  const mapHost = host.querySelector("[data-suggestion-preview-map]");
  const fallback = host.querySelector("[data-suggestion-preview-fallback]");

  if (!mapHost || !fallback || !location) {
    return;
  }

  const nextToken = String(Number(host.dataset.renderToken || "0") + 1);
  host.dataset.renderToken = nextToken;

  if (!clientId) {
    mapHost.hidden = true;
    fallback.hidden = false;
    fallback.textContent = "지도 미리보기는 네이버 지도 키가 연결되면 바로 보여줄 수 있어요.";
    return;
  }

  try {
    await loadNaverMapsSdk(clientId);

    if (host.dataset.renderToken !== nextToken || !host.isConnected) {
      return;
    }

    const naverMaps = window.naver?.maps;

    if (!naverMaps?.Map) {
      throw new Error("NAVER Maps SDK is not ready.");
    }

    const position = new naverMaps.LatLng(location.latitude, location.longitude);
    mapHost.hidden = false;
    fallback.hidden = true;
    mapHost.replaceChildren();

    const map = new naverMaps.Map(mapHost, {
      center: position,
      zoom: 16,
      zoomControl: false,
      mapDataControl: false,
      scaleControl: false,
      logoControl: false,
      draggable: false,
      scrollWheel: false,
      disableDoubleTapZoom: true,
      pinchZoom: false,
      keyboardShortcuts: false
    });

    new naverMaps.Marker({
      position,
      map,
      title: location.name
    });

    window.requestAnimationFrame(() => {
      if (!mapHost.isConnected) {
        return;
      }

      const width = Math.max(mapHost.clientWidth, 240);
      const height = Math.max(mapHost.clientHeight, 176);
      map.setSize(new naverMaps.Size(width, height));
      map.autoResize();
    });
  } catch (error) {
    console.error("Failed to render suggestion preview map", error);

    if (host.dataset.renderToken !== nextToken || !host.isConnected) {
      return;
    }

    mapHost.hidden = true;
    fallback.hidden = false;
    fallback.textContent = "지도를 불러오지 못했어요. 아래 네이버 링크로 위치를 확인해 주세요.";
  }
}

function renderSuggestionPreview(target, location, clientId) {
  if (!target) {
    return;
  }

  if (!location) {
    target.innerHTML = `
      <div class="suggestion-preview-card suggestion-preview-card-empty">
        <strong>후보 미리보기</strong>
        <p>검색 결과를 고르면 오른쪽에서 위치 확인용 지도와 링크를 함께 보여드릴게요.</p>
      </div>
    `;
    return;
  }

  const mapUrl = buildMapSearchUrl(location);
  const detailUrl = getDetailUrl(location);
  const metaLine = [location.category, location.distanceLabel].filter(Boolean).join(" · ");

  target.innerHTML = `
    <div class="suggestion-preview-card">
      <div class="suggestion-preview-copy">
        <strong>후보 미리보기</strong>
        <h3>${escapeHtml(location.name)}</h3>
        <p>${escapeHtml(location.address)}</p>
        ${metaLine ? `<p class="suggestion-preview-meta">${escapeHtml(metaLine)}</p>` : ""}
      </div>
      <div class="suggestion-preview-map" data-suggestion-preview-map></div>
      <p class="form-help-note suggestion-preview-fallback" data-suggestion-preview-fallback hidden></p>
      <div class="suggestion-actions">
        <a
          class="suggestion-link"
          href="${escapeHtml(mapUrl)}"
          target="_blank"
          rel="noreferrer"
        >
          네이버 지도에서 보기
        </a>
        ${
          detailUrl !== mapUrl
            ? `
              <a
                class="suggestion-link suggestion-link-muted"
                href="${escapeHtml(detailUrl)}"
                target="_blank"
                rel="noreferrer"
              >
                상세 페이지
              </a>
            `
            : ""
        }
      </div>
    </div>
  `;

  renderPreviewMap(target, location, clientId);
}

function renderSuggestions(
  target,
  suggestions,
  activeSuggestionId,
  { onPreview, onSelect, clientId }
) {
  if (suggestions.length === 0) {
    target.innerHTML =
      '<p class="form-help-note">검색 결과가 없어요. 다른 장소명이나 주소로 다시 시도해 주세요.</p>';
    return;
  }

  const activeSuggestion =
    suggestions.find((item) => item.id === activeSuggestionId) || suggestions[0];

  target.innerHTML = `
    <div class="suggestion-results">
      <div class="suggestion-list">
        ${suggestions
          .map((item) => {
            const isActive = item.id === activeSuggestion.id;
            const mapUrl = buildMapSearchUrl(item);
            const detailUrl = getDetailUrl(item);

            return `
              <article
                class="suggestion-item ${isActive ? "is-active" : ""}"
                data-preview-suggestion-id="${escapeHtml(item.id)}"
              >
                <button
                  type="button"
                  class="suggestion-select"
                  data-select-suggestion-id="${escapeHtml(item.id)}"
                >
                  <strong>${escapeHtml(item.name)}</strong>
                  <span>${escapeHtml(item.address)}</span>
                  <span>${escapeHtml(
                    [item.category, item.distanceLabel].filter(Boolean).join(" · ")
                  )}</span>
                </button>
                <div class="suggestion-actions">
                  <a
                    class="suggestion-link"
                    href="${escapeHtml(mapUrl)}"
                    target="_blank"
                    rel="noreferrer"
                  >
                    지도 보기
                  </a>
                  ${
                    detailUrl !== mapUrl
                      ? `
                        <a
                          class="suggestion-link suggestion-link-muted"
                          href="${escapeHtml(detailUrl)}"
                          target="_blank"
                          rel="noreferrer"
                        >
                          상세 보기
                        </a>
                      `
                      : ""
                  }
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
      <aside class="suggestion-preview" data-suggestion-preview></aside>
    </div>
  `;

  target.querySelectorAll("[data-preview-suggestion-id]").forEach((element) => {
    const updatePreview = () => {
      const previewId = element.dataset.previewSuggestionId;
      const nextSuggestion = suggestions.find((item) => item.id === previewId);

      if (nextSuggestion) {
        onPreview(nextSuggestion);
      }
    };

    element.addEventListener("mouseenter", updatePreview);
    element.addEventListener("focusin", updatePreview);
  });

  target.querySelectorAll("[data-select-suggestion-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = suggestions.find(
        (item) => item.id === button.dataset.selectSuggestionId
      );

      if (selected) {
        onSelect(selected);
      }
    });
  });

  renderSuggestionPreview(
    target.querySelector("[data-suggestion-preview]"),
    activeSuggestion,
    clientId
  );
}

function renderSelectedLocation(target, selectedLocation) {
  if (!selectedLocation) {
    target.innerHTML = "";
    return;
  }

  const mapUrl = buildMapSearchUrl(selectedLocation);
  const detailUrl = getDetailUrl(selectedLocation);

  target.innerHTML = `
    <div class="selected-location-chip">
      <strong>선택된 위치</strong>
      <span>${escapeHtml(selectedLocation.name)}</span>
      <span>${escapeHtml(selectedLocation.address)}</span>
      <div class="selected-location-actions">
        <a
          class="suggestion-link"
          href="${escapeHtml(mapUrl)}"
          target="_blank"
          rel="noreferrer"
        >
          네이버 지도에서 확인
        </a>
        ${
          detailUrl !== mapUrl
            ? `
              <a
                class="suggestion-link suggestion-link-muted"
                href="${escapeHtml(detailUrl)}"
                target="_blank"
                rel="noreferrer"
              >
                상세 보기
              </a>
            `
            : ""
        }
      </div>
    </div>
  `;
}

export function createAddPlaceForm(state, actions) {
  const wrapper = document.createElement("div");
  wrapper.className = "suggestion-modal-overlay";

  wrapper.innerHTML = `
    <div class="suggestion-modal" role="dialog" aria-modal="true" aria-labelledby="suggestion-modal-title">
      <div class="suggestion-modal-head">
        <div>
          <p class="section-kicker">New suggestion</p>
          <h2 id="suggestion-modal-title">새 장소 후보 올리기</h2>
          <p class="suggestion-modal-copy">
            메인 화면은 리스트와 지도에 집중하고, 후보 등록은 여기서 빠르게 마무리해요.
          </p>
        </div>
        <button class="ghost-button suggestion-close-button" type="button" data-action="close-form">
          닫기
        </button>
      </div>
      <form class="place-form suggestion-modal-form">
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
            <input type="text" value="${escapeHtml(
              state.nickname || "닉네임을 먼저 입력해 주세요"
            )}" disabled />
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
                  placeholder="예: 성심당, 오씨칼국수, 중앙로역"
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
              placeholder="왜 가고 싶은지, 어떤 포인트가 좋은지 적어 주세요"
            ></textarea>
          </label>
        </div>
        <div class="suggestion-modal-foot">
          <p class="form-caption">
            중앙로역 기준으로 가까운 후보를 먼저 보여드리고, 오른쪽 미리보기에서 지도와 링크까지 바로 확인할 수 있어요.
          </p>
          <button class="primary-button" type="submit" ${state.isSavingPlace ? "disabled" : ""}>
            ${state.isSavingPlace ? "장소 저장 중..." : "장소 올리기"}
          </button>
        </div>
      </form>
    </div>
  `;

  const mapsClientId = state.runtimeConfig.naverMapsClientId;
  let selectedLocation = null;
  let previewLocation = null;

  const form = wrapper.querySelector("form");
  const nameInput = form.querySelector('input[name="name"]');
  const addressInput = form.querySelector('input[name="address"]');
  const suggestionsSlot = wrapper.querySelector('[data-slot="suggestions"]');
  const selectedLocationSlot = wrapper.querySelector('[data-slot="selected-location"]');
  const searchButton = wrapper.querySelector('[data-action="search-address"]');
  const closeButton = wrapper.querySelector('[data-action="close-form"]');

  const selectLocation = (location) => {
    selectedLocation = location;
    previewLocation = location;
    nameInput.value = location.name;
    addressInput.value = location.address;
    renderSelectedLocation(selectedLocationSlot, selectedLocation);
    suggestionsSlot.innerHTML = "";
  };

  const renderSearchResults = (suggestions) => {
    if (suggestions.length === 0) {
      previewLocation = null;
    } else if (!previewLocation || !suggestions.some((item) => item.id === previewLocation.id)) {
      [previewLocation] = suggestions;
    }

    renderSuggestions(suggestionsSlot, suggestions, previewLocation?.id, {
      clientId: mapsClientId,
      onPreview(location) {
        previewLocation = location;
        renderSearchResults(suggestions);
      },
      onSelect: selectLocation
    });
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
        distanceLabel: getDistanceLabel(item.distanceMeters)
      }));

      renderSearchResults(suggestions);
      return suggestions;
    } catch (error) {
      suggestionsSlot.innerHTML = `
        <p class="form-help-note">
          ${escapeHtml(error instanceof Error ? error.message : "장소 검색에 실패했습니다.")}
        </p>
      `;
      return [];
    }
  };

  closeButton.addEventListener("click", actions.closeAddForm);

  wrapper.addEventListener("click", (event) => {
    if (event.target === wrapper) {
      actions.closeAddForm();
    }
  });

  searchButton.addEventListener("click", runSearch);

  addressInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    runSearch();
  });

  addressInput.addEventListener("input", () => {
    selectedLocation = null;
    previewLocation = null;
    renderSelectedLocation(selectedLocationSlot, null);
    suggestionsSlot.innerHTML = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!selectedLocation && mapsClientId) {
      const suggestions = await runSearch();

      if (suggestions.length === 1) {
        selectLocation(suggestions[0]);
      } else if (suggestions.length > 1) {
        window.alert("장소 후보가 여러 개예요. 먼저 하나를 선택해 주세요.");
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

  window.requestAnimationFrame(() => {
    addressInput.focus();
  });

  return wrapper;
}
