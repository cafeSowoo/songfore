export function createEntryGate(state, actions) {
  if (state.accessGranted) {
    return null;
  }

  const overlay = document.createElement("div");
  overlay.className = "entry-gate";

  overlay.innerHTML = `
    <div class="entry-card">
      <p class="eyebrow">Nickname first</p>
      <h2>같이 채우기 전에 닉네임만 정해둘게요</h2>
      <p class="entry-copy">
        지금은 초대코드 없이 진행하고, 작성자 이름만 먼저 기록합니다.
      </p>
      <form class="entry-form">
        <label>
          <span>닉네임</span>
          <input name="nickname" type="text" placeholder="예: 지석" value="${state.nickname}" required />
        </label>
        <button class="primary-button" type="submit">보드 들어가기</button>
      </form>
    </div>
  `;

  overlay.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    actions.unlockAccess({
      nickname: String(formData.get("nickname") || "")
    });
  });

  return overlay;
}
