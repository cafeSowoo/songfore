const CATEGORY_OPTIONS = [
  { value: "restaurant", label: "식당" },
  { value: "cafe", label: "카페" },
  { value: "shopping", label: "쇼핑" },
  { value: "tour", label: "관광지" },
  { value: "stay", label: "숙소" },
  { value: "etc", label: "기타" }
];

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
            <input type="text" value="${state.nickname || "닉네임이 아직 없습니다"}" disabled />
          </label>
          <label class="form-span-2">
            <span>장소명</span>
            <input name="name" type="text" placeholder="예: 성심당 DCC점" required />
          </label>
          <label class="form-span-2">
            <span>주소 또는 검색어</span>
            <input name="address" type="text" placeholder="예: 대전 유성구 엑스포로 107" required />
          </label>
          <label class="form-span-2">
            <span>한 줄 메모</span>
            <textarea name="description" rows="3" placeholder="왜 가고 싶은지 짧게 적어 주세요"></textarea>
          </label>
        </div>
        <p class="form-caption">저장할 때 Netlify Function이 네이버 지오코딩으로 좌표를 자동 계산합니다.</p>
        <button class="primary-button" type="submit" ${state.isSavingPlace ? "disabled" : ""}>
          ${state.isSavingPlace ? "장소 저장 중..." : "장소 올리기"}
        </button>
      </form>
    </div>
  `;

  wrapper
    .querySelector('[data-action="toggle-form"]')
    .addEventListener("click", actions.toggleAddForm);

  wrapper.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    actions.addPlace({
      category: String(formData.get("category") || "etc"),
      name: String(formData.get("name") || ""),
      address: String(formData.get("address") || ""),
      description: String(formData.get("description") || "")
    });
  });

  return wrapper;
}
