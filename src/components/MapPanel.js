import { loadNaverMapsSdk } from "../lib/naverMaps.js";

function getCategoryColor(state, categoryId) {
  return state.categories.find((category) => category.id === categoryId)?.color || "#1e1e1e";
}

function getSelectedPlace(state) {
  return state.filteredPlaces.find((place) => place.id === state.selectedPlaceId) || state.filteredPlaces[0];
}

function renderPreviewMap(host, state, actions) {
  const preview = host.querySelector("[data-map-preview]");
  const selectedId = state.selectedPlaceId;

  preview.hidden = false;
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
  const mapHost = host.querySelector("[data-real-map]");
  const preview = host.querySelector("[data-map-preview]");

  if (!clientId) {
    mapHost.hidden = true;
    renderPreviewMap(host, state, actions);
    return;
  }

  try {
    await loadNaverMapsSdk(clientId);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    if (!host.isConnected || !window.naver?.maps?.Map) {
      throw new Error("NAVER Maps SDK is not ready.");
    }

    const naverMaps = window.naver.maps;
    const places = state.filteredPlaces;
    const focusPlace = getSelectedPlace(state);

    preview.hidden = true;
    mapHost.hidden = false;
    mapHost.replaceChildren();

    const map = new naverMaps.Map(mapHost, {
      center: focusPlace
        ? new naverMaps.LatLng(focusPlace.latitude, focusPlace.longitude)
        : new naverMaps.LatLng(36.3504119, 127.3845475),
      zoom: focusPlace ? 14 : 11,
      zoomControl: true,
      mapDataControl: false,
      scaleControl: false,
      logoControl: false
    });

    if (places.length > 1) {
      const bounds = new naverMaps.LatLngBounds();
      places.forEach((place) =>
        bounds.extend(new naverMaps.LatLng(place.latitude, place.longitude))
      );
      map.fitBounds(bounds, { top: 72, right: 72, bottom: 160, left: 72 });
    }

    places.forEach((place) => {
      const isSelected = place.id === state.selectedPlaceId;
      const markerSize = isSelected ? 24 : 18;

      const marker = new naverMaps.Marker({
        position: new naverMaps.LatLng(place.latitude, place.longitude),
        map,
        title: place.name,
        icon: {
          content: `
            <div style="
              width: ${markerSize}px;
              height: ${markerSize}px;
              border-radius: 999px;
              border: 3px solid #ffffff;
              background: ${getCategoryColor(state, place.category)};
              box-shadow: 0 10px 24px rgba(15, 23, 42, 0.24);
              transform: translate(-50%, -50%);
            "></div>
          `,
          anchor: new naverMaps.Point(markerSize / 2, markerSize / 2)
        }
      });

      naverMaps.Event.addListener(marker, "click", () => actions.selectPlace(place.id));
    });

    window.requestAnimationFrame(() => {
      naverMaps.Event.trigger(map, "resize");
    });
  } catch (error) {
    console.error("Failed to render NAVER map", error);
    mapHost.hidden = true;
    renderPreviewMap(host, state, actions);
  }
}

export function createMapPanel(state) {
  const selectedPlace = getSelectedPlace(state);
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
      <p class="map-helper">
        네이버 지도가 준비되면 실제 지도와 마커를 보여주고, 실패하면 위치 프리뷰로 이어집니다.
      </p>
    </div>
    <div class="map-stage">
      <div class="map-preview" data-map-preview></div>
      <div class="real-map" data-real-map hidden></div>
      <div class="empty-map-state" data-empty-map-state hidden>
        <strong>첫 장소를 올리면 여기에 바로 마커가 생깁니다.</strong>
        <p>식당이든 관광지든 하나만 추가해도 지도와 리스트가 함께 채워집니다.</p>
      </div>
      <div class="map-selection-card">
        <div>
          <span class="place-badge" style="--category-accent:${selectedCategory?.color || "#1e1e1e"}">
            ${selectedCategory?.label || "선택 없음"}
          </span>
          <h3>${selectedPlace?.name || "장소를 선택해 주세요"}</h3>
        </div>
        <p>${selectedPlace?.address || "아직 등록된 주소가 없습니다."}</p>
        <p class="selection-note">${selectedPlace?.description || "장소를 누르면 메모와 댓글을 같이 볼 수 있어요."}</p>
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
  const emptyState = mapPanel.querySelector("[data-empty-map-state]");
  const hasPlaces = state.filteredPlaces.length > 0;

  emptyState.hidden = hasPlaces;
  emptyState.classList.toggle("is-visible", !hasPlaces);

  renderPreviewMap(mapPanel, state, actions);
  renderNaverMap(mapPanel, state, actions);
}
