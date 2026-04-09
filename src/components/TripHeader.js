export function createTripHeader(state, actions) {
  const wrapper = document.createElement("header");
  wrapper.className = "trip-header";

  const selectedPlace = state.filteredPlaces.find(
    (place) => place.id === state.selectedPlaceId
  );

  const statusText = state.isInitializing
    ? "실제 여행 데이터를 불러오는 중입니다."
    : state.errorMessage || state.uiNotice;

  wrapper.innerHTML = `
    <p class="eyebrow">Shared travel board</p>
    <div class="header-row">
      <div>
        <h1>${state.trip.title}</h1>
        <p class="lead">${state.trip.description}</p>
      </div>
      <button class="ghost-button" type="button" data-action="copy-url">URL 복사</button>
    </div>
    <div class="hero-band">
      <div>
        <p class="hero-label">이번 보드의 기준</p>
        <p class="hero-text">
          맛집, 쇼핑, 산책 코스를 한 페이지에서 쌓고, 누가 올렸는지 바로 보이게 만듭니다.
        </p>
      </div>
      <div class="hero-meta">
        <span>선택된 장소</span>
        <strong>${selectedPlace ? selectedPlace.name : "아직 없음"}</strong>
      </div>
    </div>
    <p class="status-line">${statusText}</p>
  `;

  wrapper
    .querySelector('[data-action="copy-url"]')
    .addEventListener("click", actions.copyUrl);

  return wrapper;
}
