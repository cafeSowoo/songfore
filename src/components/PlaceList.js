import { createCommentSection } from "./CommentSection.js";

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function createPlaceList(state, actions) {
  const wrapper = document.createElement("div");
  wrapper.className = "place-list";

  const countLabel = `${state.filteredPlaces.length}개의 장소`;

  wrapper.innerHTML = `
    <div class="section-heading section-heading-inline">
      <div>
        <p class="section-kicker">Shared picks</p>
        <h2>${countLabel}</h2>
      </div>
      <p class="section-caption">왼쪽 카드를 누르면 오른쪽 지도와 함께 움직입니다.</p>
    </div>
  `;

  const list = document.createElement("div");
  list.className = "place-card-list";

  if (state.filteredPlaces.length === 0) {
    const emptyCard = document.createElement("article");
    emptyCard.className = "place-card is-empty";
    emptyCard.innerHTML = `
      <div class="empty-card">
        <h3>아직 등록된 장소가 없어요</h3>
        <p>첫 번째 식당이나 관광지를 올리면 이 리스트와 지도가 바로 채워집니다.</p>
      </div>
    `;
    list.append(emptyCard);
    wrapper.append(list);
    return wrapper;
  }

  for (const place of state.filteredPlaces) {
    const card = document.createElement("article");
    const category = state.categories.find((item) => item.id === place.category);
    const isSelected = place.id === state.selectedPlaceId;

    card.className = `place-card ${isSelected ? "is-selected" : ""}`;
    card.style.setProperty("--category-accent", category?.color || "#1e1e1e");
    card.innerHTML = `
      <button class="place-card-hitarea" type="button" data-place-id="${place.id}">
        <div class="place-card-topline">
          <span class="place-badge">${category?.label || "기타"}</span>
          <span class="place-date">${formatDate(place.createdAt)}</span>
        </div>
        <h3>${place.name}</h3>
        <p class="place-address">${place.address}</p>
        <p class="place-description">${place.description || "설명이 아직 없습니다."}</p>
        <div class="place-meta">
          <span>작성자 ${place.author}</span>
          <span>댓글 ${place.comments.length}</span>
        </div>
      </button>
    `;

    card
      .querySelector("[data-place-id]")
      .addEventListener("click", () => actions.selectPlace(place.id));

    if (isSelected) {
      card.append(
        createCommentSection(place, {
          addComment: actions.addComment,
          isSaving: state.isSavingComment
        })
      );
    }

    list.append(card);
  }

  wrapper.append(list);
  return wrapper;
}
