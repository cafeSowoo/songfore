import { ChatIcon, HeartIcon, MapPinIcon, PeopleIcon, TrashIcon } from "./Icons.js";
import { PlaceCard } from "./PlaceCard.js";

const { createElement: h, useState } = window.React;

function normalizeNickname(value) {
  return String(value || "").trim();
}

function getInitial(name) {
  const normalized = normalizeNickname(name);
  const characters = Array.from(normalized);

  if (!characters.length) {
    return "나";
  }

  if (/^[가-힣]$/.test(characters[0])) {
    return characters[0];
  }

  return characters.slice(0, 2).join("").toUpperCase();
}

export function MyPage({
  nickname = "",
  places = [],
  onEditNickname,
  onDeletePlace,
  onLogout,
  onOpenAdd,
  onOpenComment,
  onOpenPlace,
  onToggleSave,
  onDeleteComment
}) {
  const [activeList, setActiveList] = useState("recommended");
  const normalizedNickname = normalizeNickname(nickname);
  const myPlaces = normalizedNickname
    ? places.filter((place) => normalizeNickname(place.friendName) === normalizedNickname)
    : [];
  const likedPlaces = places.filter((place) => place.saved);
  const myComments = normalizedNickname
    ? places.flatMap((place) =>
        (place.comments || [])
          .filter((comment) => normalizeNickname(comment.name) === normalizedNickname)
          .map((comment) => ({
            ...comment,
            placeId: place.id,
            placeName: place.name,
            category: place.category
          }))
      )
    : [];
  const activePlaces = activeList === "liked" ? likedPlaces : myPlaces;
  const activeListTitle =
    activeList === "liked"
      ? "좋아요한 장소"
      : activeList === "comments"
        ? "내가 단 댓글"
        : "내가 추천한 장소";

  return h(
    "section",
    { className: "profile-section" },
    h(
      "div",
      { className: "profile-hero" },
      h(
        "div",
        { className: "profile-avatar", "aria-hidden": "true" },
        getInitial(normalizedNickname)
      ),
      h(
        "div",
        { className: "profile-hero-copy" },
        normalizedNickname
          ? h(
              "div",
              { className: "profile-action-row profile-action-row-inline" },
              h(
                "button",
                {
                  type: "button",
                  className: "profile-edit-button",
                  onClick: onEditNickname
                },
                "닉네임 변경"
              ),
              h(
                "button",
                {
                  type: "button",
                  className: "profile-logout-button",
                  onClick: onLogout
                },
                "로그아웃"
              )
            )
          : [
              h("h2", { key: "title" }, "닉네임을 정해주세요 (예: JS, 지석)"),
              h(
                "p",
                { key: "copy" },
                "닉네임이 일치해야 내가 추천한 장소를 삭제할 수 있어요."
              )
            ]
      ),
      normalizedNickname
        ? null
        : h(
            "div",
            { className: "profile-action-row" },
            h(
              "button",
              {
                type: "button",
                className: "profile-edit-button",
                onClick: onEditNickname
              },
              "닉네임 입력"
            )
          )
    ),
    h(
      "div",
      { className: "profile-stats" },
      h(
        "button",
        {
          type: "button",
          className: `profile-stat-card ${activeList === "recommended" ? "active" : ""}`,
          onClick: () => setActiveList("recommended")
        },
        h(
          "div",
          { className: "profile-stat-value" },
          h("strong", null, myPlaces.length),
          h(PeopleIcon, { className: "profile-stat-icon" })
        ),
        h("span", null, "내가 추천")
      ),
      h(
        "button",
        {
          type: "button",
          className: `profile-stat-card ${activeList === "liked" ? "active" : ""}`,
          onClick: () => setActiveList("liked")
        },
        h(
          "div",
          { className: "profile-stat-value" },
          h("strong", null, likedPlaces.length),
          h(HeartIcon, { className: "profile-stat-icon", filled: true })
        ),
        h("span", null, "좋아요한 장소")
      ),
      h(
        "button",
        {
          type: "button",
          className: `profile-stat-card ${activeList === "comments" ? "active" : ""}`,
          onClick: () => setActiveList("comments")
        },
        h(
          "div",
          { className: "profile-stat-value" },
          h("strong", null, myComments.length),
          h(ChatIcon, { className: "profile-stat-icon" })
        ),
        h("span", null, "내가 단 댓글")
      )
    ),
    h(
      "div",
      { className: "profile-list-head" },
      h(
        "div",
        null,
        h("strong", null, activeListTitle)
      )
    ),
    activeList === "comments"
      ? myComments.length
        ? h(
            "div",
            { className: "profile-comment-list" },
            ...myComments.map((comment) =>
              h(
                "div",
                {
                  key: comment.id,
                  className: "profile-comment-item"
                },
                h(
                  "button",
                  {
                    type: "button",
                    className: "profile-comment-content-button",
                    onClick: () => onOpenComment?.(comment.placeId, comment.id)
                  },
                  h("strong", null, comment.placeName),
                  h("span", null, comment.time),
                  h("p", null, comment.text)
                ),
                h(
                  "button",
                  {
                    type: "button",
                    className: "profile-comment-delete-button",
                    "aria-label": "댓글 삭제",
                    onClick: () => onDeleteComment?.(comment.placeId, comment.id)
                  },
                  h(TrashIcon, { className: "profile-comment-delete-icon" })
                )
              )
            )
          )
        : h(
            "div",
            { className: "profile-empty-state" },
            h(ChatIcon, { className: "profile-empty-icon" }),
            h("strong", null, "아직 단 댓글이 없어요."),
            h("p", null, "장소 상세에서 한마디를 남기면 여기에서 모아볼게요.")
          )
      : activePlaces.length
      ? h(
          "div",
          { className: "profile-place-list" },
          ...activePlaces.map((place) =>
            h(
              "div",
              { key: place.id, className: "profile-place-item" },
              h(PlaceCard, {
                place,
                variant: "compact",
                onOpen: onOpenPlace,
                onToggleSave
              }),
              activeList === "recommended"
                ? h(
                    "button",
                    {
                      type: "button",
                      className: "profile-place-delete-button",
                      "aria-label": "추천 장소 삭제",
                      onClick: (event) => {
                        event.stopPropagation();
                        onDeletePlace?.(place.id);
                      }
                    },
                    h(TrashIcon, { className: "profile-place-delete-icon" })
                  )
                : null
            )
          )
        )
      : h(
          "div",
          { className: "profile-empty-state" },
          h(MapPinIcon, { className: "profile-empty-icon" }),
          activeList === "liked" || normalizedNickname
            ? h(
                "strong",
                null,
                activeList === "liked" ? "아직 좋아요한 장소가 없어요." : "아직 추천한 장소가 없어요."
              )
            : null,
          h(
            "p",
            null,
            activeList === "liked"
              ? "마음에 드는 장소의 하트를 눌러 모아보세요."
              : normalizedNickname
                ? "좋아 보이는 장소를 발견하면 바로 추천해보세요."
                : "입력한 닉네임을 기준으로 내가 올린 장소를 모아둘게요."
          ),
          activeList === "recommended"
            ? h(
                "button",
                {
                  type: "button",
                  className: "header-add-pill-button",
                  onClick: normalizedNickname ? onOpenAdd : onEditNickname
                },
                normalizedNickname ? "+ 장소 추천" : "닉네임 입력"
              )
            : null
        )
  );
}
