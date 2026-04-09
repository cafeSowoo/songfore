function loadNaverMapScript(clientId) {
  const existingScript = document.querySelector('script[data-naver-map-script="true"]');
  if (existingScript) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.dataset.naverMapScript = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load NAVER Maps SDK"));
    document.head.append(script);
  });
}

function getCategoryColor(state, categoryId) {
  return state.categories.find((category) => category.id === categoryId)?.color || "#1e1e1e";
}

function renderPreviewMap(host, state, actions) {
  const preview = host.querySelector("[data-map-preview]");
  const selectedId = state.selectedPlaceId;

  preview.innerHTML = `
    <div class="map-grid"></div>
    ${state.filteredPlaces
      .map((place) => {
        const isSelected = place.id === selectedId;
        return `
          <button
            type="button"
            class="map-marker ${isSelected ? "is-selected" : ""}"
            data-map-place="${place.id}"
            style="left:${place.mapX}%; top:${place.mapY}%; --marker-color:${getCategoryColor(
              state,
              place.category
            )}"
            aria-label="${place.name}"
          >
            <span></span>
          </button>
        `;
      })
      .join("")}
  `;

  preview.querySelectorAll("[data-map-place]").forEach((button) => {
    button.addEventListener("click", () => actions.selectPlace(button.dataset.mapPlace));
  });
}

async function renderNaverMap(host, state, actions) {
  const clientId = state.runtimeConfig.naverMapsClientId;
  if (!clientId) {
    renderPreviewMap(host, state, actions);
    return;
  }

  const mapHost = host.querySelector("[data-real-map]");
  const preview = host.querySelector("[data-map-preview]");

  try {
    await loadNaverMapScript(clientId);
  } catch {
    renderPreviewMap(host, state, actions);
    return;
  }

  if (!window.naver?.maps) {
    renderPreviewMap(host, state, actions);
    return;
  }

  preview.hidden = true;
  mapHost.hidden = false;
  mapHost.replaceChildren();

  const focusPlace =
    state.filteredPlaces.find((place) => place.id === state.selectedPlaceId) || state.filteredPlaces[0];

  const map = new window.naver.maps.Map(mapHost, {
    center: focusPlace
      ? new window.naver.maps.LatLng(focusPlace.latitude, focusPlace.longitude)
      : new window.naver.maps.LatLng(36.3504119, 127.3845475),
    zoom: focusPlace ? 13 : 11,
    zoomControl: true,
    mapDataControl: false,
    logoControl: false
  });

  state.filteredPlaces.forEach((place) => {
    const marker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(place.latitude, place.longitude),
      map,
      title: place.name,
      icon: {
        content: `
          <div style="
            width: 18px;
            height: 18px;
            border-radius: 999px;
            border: 3px solid white;
            background: ${getCategoryColor(state, place.category)};
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.24);
          "></div>
        `
      }
    });

    window.naver.maps.Event.addListener(marker, "click", () => actions.selectPlace(place.id));
  });
}

export function createMapPanel(state) {
  const selectedPlace =
    state.filteredPlaces.find((place) => place.id === state.selectedPlaceId) || state.filteredPlaces[0];
  const selectedCategory = state.categories.find(
    (category) => category.id === selectedPlace?.category
  );

  const wrapper = document.createElement("section");
  wrapper.className = "map-panel";
  wrapper.innerHTML = `
    <div class="map-panel-head">
      <div>
        <p class="section-kicker">Map workspace</p>
        <h2>오른쪽에서 위치를 바로 훑어볼 수 있게</h2>
      </div>
      <p class="map-helper">네이버 지도가 준비되면 실제 좌표 마커가, 아니면 데모 프리뷰가 표시됩니다.</p>
    </div>
    <div class="map-stage">
      <div class="map-preview" data-map-preview></div>
      <div class="real-map" data-real-map hidden></div>
      <div class="map-selection-card">
        <div>
          <span class="place-badge" style="--category-accent:${selectedCategory?.color || "#1e1e1e"}">
            ${selectedCategory?.label || "선택 없음"}
          </span>
          <h3>${selectedPlace?.name || "장소를 선택해 주세요"}</h3>
        </div>
        <p>${selectedPlace?.address || "주소가 아직 없습니다."}</p>
        <p class="selection-note">${selectedPlace?.description || "장소 설명이 여기에 표시됩니다."}</p>
      </div>
    </div>
    <div class="legend-row">
      ${state.categories
        .filter((category) => category.id !== "all")
        .map(
          (category) => `
            <span class="legend-item">
              <i style="background:${category.color}"></i>
              ${category.label}
            </span>
          `
        )
        .join("")}
    </div>
  `;

  return wrapper;
}

export function enhanceMapPanel(mapPanel, state, actions) {
  if (state.filteredPlaces.length === 0) {
    const preview = mapPanel.querySelector("[data-map-preview]");
    preview.innerHTML = `
      <div class="map-grid"></div>
      <div class="empty-map-state">
        <strong>첫 장소를 올리면 여기에 바로 마커가 생깁니다.</strong>
        <p>식당이든 관광지든 하나만 추가해도 지도와 리스트가 같이 채워집니다.</p>
      </div>
    `;
    return;
  }

  renderPreviewMap(mapPanel, state, actions);
  renderNaverMap(mapPanel, state, actions);
}
