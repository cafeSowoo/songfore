function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function createCommentSection(place, options) {
  const wrapper = document.createElement("div");
  wrapper.className = "comment-section";

  wrapper.innerHTML = `
    <div class="comment-list">
      ${
        place.comments.length > 0
          ? place.comments
              .map(
                (comment) => `
                  <article class="comment-item">
                    <div class="comment-meta">
                      <strong>${comment.author}</strong>
                      <span>${formatDate(comment.createdAt)}</span>
                    </div>
                    <p>${comment.content}</p>
                  </article>
                `
              )
              .join("")
          : '<p class="empty-note">첫 댓글을 남겨서 이 장소의 분위기를 만들어 보세요.</p>'
      }
    </div>
    <form class="comment-form">
      <input name="comment" type="text" placeholder="여기에 코멘트를 남겨 주세요" />
      <button type="submit" class="text-button" ${options.isSaving ? "disabled" : ""}>
        ${options.isSaving ? "저장 중..." : "댓글 남기기"}
      </button>
    </form>
  `;

  wrapper.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    options.addComment(place.id, String(formData.get("comment") || ""));
  });

  return wrapper;
}
