import { getCategoryById } from "../lib/api.js";
import { HeartIcon } from "./Icons.js";
import { PlaceImage } from "./PlaceImage.js";

const { createElement: h } = window.React;

function toRecommendedLabel(label, friendName) {
  const safeFriendName = friendName || "친구";

  if (!label) {
    return `${safeFriendName}이 방금 추천`;
  }

  const replaced = String(label).replace(/저장/g, "추천");

  if (replaced.includes(safeFriendName)) {
    return replaced;
  }

  return `${safeFriendName} ${replaced}`;
}

export function PlaceCard({ place, onOpen, onToggleSave }) {
  const category = getCategoryById(place.category);

  return h(
    "article",
    {
      className: "place-card",
      onClick: () => onOpen(place.id)
    },
    h(PlaceImage, {
      src: place.imageUrl,
      alt: place.name,
      className: "place-card-image-frame",
      overlay: h(
        "div",
        { className: "place-card-overlay-grid" },
        h(
          "button",
          {
            type: "button",
            className: `save-toggle-button ${place.saved ? "active" : ""}`,
            onClick: (event) => {
              event.stopPropagation();
              onToggleSave(place.id);
            },
            "aria-label": place.saved ? "좋아요 취소" : "좋아요"
          },
          h(HeartIcon, {
            className: "save-icon",
            filled: place.saved
          })
        ),
        h(
          "span",
          {
            className: "category-pill image-category-pill",
            style: { "--chip-tone": category.tone }
          },
          category.label
        ),
        h(
          "span",
          { className: "save-count-badge" },
          h(HeartIcon, {
            className: "save-icon",
            filled: true
          }),
          h("span", null, place.saveCount)
        )
      )
    }),
    h(
      "div",
      { className: "place-card-body" },
      h(
        "div",
        { className: "place-card-topline" },
        h(
          "div",
          { className: "place-card-heading" },
          h("h3", null, place.name)
        ),
        h(
          "span",
          { className: "place-time" },
          toRecommendedLabel(place.createdLabel, place.friendName)
        )
      ),
      h(
        "p",
        {
          className: "friend-note",
          style: { "--note-tone": category.tone }
        },
        `“${place.friendNote}”`
      )
    )
  );
}
