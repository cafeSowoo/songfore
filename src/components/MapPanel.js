import { loadNaverMapsSdk } from "../lib/naverMaps.js";

function getCategoryColor(state, categoryId) {
  return state.categories.find((category) => category.id === categoryId)?.color || "#1e1e1e";
}

function getSelectedPlace(state) {
  return state.filteredPlaces.find((place) => place.id === state.selectedPlaceId) || state.filteredPlaces[0];
}

function setMapStatus(host, message = "") {
  const status = host.querySelector("[data-map-status]");

  if (!status) {
    return;
  }

  status.hidden = !message;
  status.textContent = message;
}

function mapLooksPainted(mapHost) {
  if (mapHost.querySelector("canvas")) {
    return true;
  }

  if (
    Array.from(mapHost.querySelectorAll("img")).some(
      (image) => image.complete && image.naturalWidth > 0
    )
  ) {
    return true;
  }

  if (mapHost.querySelector("svg")) {
    return true;
  }

  return Array.from(mapHost.querySelectorAll("*")).some((element) => {
    const style = window.getComputedStyle(element);
    const hasBackgroundImage =
      style.backgroundImage &&
      style.backgroundImage !== "none" &&
      style.visibility !== "hidden" &&
      style.display !== "none";
    const rect = element.getBoundingClientRect();

    return hasBackgroundImage && rect.width > 8 && rect.height > 8;
  });
}

function mapHasRenderableDom(mapHost) {
  return Array.from(mapHost.querySelectorAll("*")).some((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 16 &&
      rect.height > 16 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  });
}

function waitForMapReady(mapHost, timeout = 6000) {
  if (mapLooksPainted(mapHost)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timer = null;
    const observedImages = new WeakSet();

    const finish = (didPaint) => {
      if (settled) {
        return;
      }

      settled = true;
      observer.disconnect();
      window.clearTimeout(timer);
      resolve(didPaint);
    };

    const inspect = () => {
      if (mapLooksPainted(mapHost)) {
        finish(true);
        return;
      }

      if (mapHasRenderableDom(mapHost)) {
        finish(true);
      }
    };

    const watchImages = () => {
      mapHost.querySelectorAll("img").forEach((image) => {
        if (observedImages.has(image)) {
          return;
        }

        observedImages.add(image);
        image.addEventListener("load", inspect, { once: true });
        image.addEventListener("error", inspect, { once: true });
      });
    };

    const observer = new MutationObserver(() => {
      watchImages();
      inspect();
    });

    observer.observe(mapHost, {
      childList: true,
      subtree: true,
      attributes: true
    });

    watchImages();
    inspect();

    timer = window.setTimeout(() => finish(mapLooksPainted(mapHost)), timeout);
  });
}

function waitForMapPaint(mapHost, timeout = 3200) {
  return waitForMapReady(mapHost, timeout).then((didRender) => {
    if (didRender) {
      return true;
    }

    return Array.from(mapHost.querySelectorAll("img")).some(
      (image) => image.complete && image.naturalWidth > 0
    );
  });
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function ensureMapHostReady(mapHost, attempts = 3) {
  mapHost.hidden = false;

  for (let index = 0; index < attempts; index += 1) {
    await waitForNextFrame();
    const { width, height } = mapHost.getBoundingClientRect();

    if (width > 0 && height > 0) {
      return;
    }
  }
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
    setMapStatus(host, "네이버 지도 키가 없어 위치 프리뷰를 표시 중입니다.");
    renderPreviewMap(host, state, actions);
    return;
  }

  try {
    await loadNaverMapsSdk(clientId);
    await waitForNextFrame();

    if (!host.isConnected || !window.naver?.maps?.Map) {
      throw new Error("NAVER Maps SDK is not ready.");
    }

    const naverMaps = window.naver.maps;
    const places = state.filteredPlaces;
    const focusPlace = getSelectedPlace(state);

    setMapStatus(host, "실제 네이버 지도를 불러오는 중입니다.");
    preview.hidden = false;
    mapHost.replaceChildren();
    await ensureMapHostReady(mapHost);

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

    const syncMapSize = () => {
      const width = mapHost.clientWidth;
      const height = mapHost.clientHeight;

      if (!width || !height) {
        return;
      }

      map.setSize(new naverMaps.Size(width, height));
      map.autoResize();
    };

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

    syncMapSize();

    window.requestAnimationFrame(() => {
      syncMapSize();
      window.requestAnimationFrame(syncMapSize);
    });

    window.setTimeout(syncMapSize, 120);

    const didPaint = await waitForMapPaint(mapHost);

    if (didPaint) {
      preview.hidden = true;
      setMapStatus(host);
      return;
    }

    setMapStatus(
      host,
      "실제 지도 타일이 보이지 않으면 네이버 클라우드 허용 도메인과 지도 영역 크기를 먼저 확인해 주세요."
    );
  } catch (error) {
    console.error("Failed to render NAVER map", error);
    mapHost.hidden = true;
    setMapStatus(host, "실제 지도를 불러오지 못해 위치 프리뷰를 유지합니다.");
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
      <p class="map-status-banner" data-map-status hidden></p>
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
