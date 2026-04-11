const { createElement: h } = window.React;

export function FriendsStrip({ friends, memberCount }) {
  return h(
    "section",
    { className: "friends-panel" },
    h(
      "div",
      { className: "section-head compact" },
      h(
        "div",
        null,
        h("span", { className: "eyebrow subtle" }, "Crew vibe"),
        h("h3", null, `${memberCount}명이 함께 고르는 후보`)
      ),
      h("span", { className: "tiny-note" }, "함께 저장할수록 더 선명해져요")
    ),
    h(
      "div",
      { className: "friend-row" },
      ...friends.map((friend) =>
        h(
          "div",
          { key: friend.id, className: "friend-pill" },
          h("span", { className: "friend-avatar" }, friend.badge),
          h(
            "div",
            { className: "friend-copy" },
            h("strong", null, friend.name),
            h("span", null, "위시리스트 참여중")
          )
        )
      )
    )
  );
}
