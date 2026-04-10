export function createSuggestionLauncher(actions) {
  const wrapper = document.createElement("section");
  wrapper.className = "suggestion-launcher";

  wrapper.innerHTML = `
    <div class="section-heading section-heading-inline">
      <div>
        <p class="section-kicker">New suggestion</p>
        <h2>후보 등록은 팝업으로 열기</h2>
      </div>
      <button class="primary-button" type="button" data-action="open-suggestion-modal">
        새 후보 올리기
      </button>
    </div>
    <p class="section-caption">
      메인 화면은 저장된 리스트와 지도만 보이게 두고, 후보 등록은 필요할 때만 열어 진행합니다.
    </p>
  `;

  wrapper
    .querySelector('[data-action="open-suggestion-modal"]')
    .addEventListener("click", actions.openAddForm);

  return wrapper;
}
