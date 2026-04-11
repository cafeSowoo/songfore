import { getCategoryById } from "../lib/api.js";
import { ArrowLeftIcon, HeartIcon, MapPinIcon } from "./Icons.js";
import { PlaceImage } from "./PlaceImage.js";

const { createElement: h } = window.React;

function buildFriendMessages(place) {
  return [
    {
      id: `${place.id}-primary`,
      name: place.friendName,
      text: place.friendNote,
      time: place.createdLabel || "방금 저장됨",
      accent: "left"
    },
    {
      id: `${place.id}-secondary`,
      name: "",
      text: place.reason,
      time: "지금 보고 있음",
      accent: "right"
    }
  ];
}

export function PlaceDetailSheet({ place, onClose, onToggleSave, onShowMap }) {
  const category = getCategoryById(place.category);
  const friendMessages = buildFriendMessages(place);

  return h(
    "div",
    { className: "sheet-overlay", onClick: onClose },
    h(
      "section",
      {
        className: "detail-sheet",
        onClick: (event) => event.stopPropagation()
      },
      h(
        "div",
        { className: "sheet-grabber-wrap" },
        h("div", { className: "sheet-grabber" })
      ),
      h(PlaceImage, {
        src: place.imageUrl,
        alt: place.name,
        className: "detail-image-frame",
        overlay: h(
          "div",
          { className: "detail-image-overlay-grid" },
          h(
            "button",
            {
              type: "button",
              className: "detail-back-button",
              onClick: onClose,
              "aria-label": "뒤로가기"
            },
            h(ArrowLeftIcon, { className: "sheet-close-icon" })
          ),
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
        { className: "detail-body" },
        h("h2", null, place.name),
        h(
          "section",
          { className: "detail-location-card" },
          h(
            "div",
            { className: "detail-location-map" },
            h("div", { className: "detail-location-grid" }),
            h(
              "div",
              { className: "detail-location-pin" },
              h(MapPinIcon, { className: "button-icon" })
            )
          )
        ),
        h(
          "section",
          { className: "detail-comments" },
          h(
            "div",
            { className: "detail-section-head detail-section-head-comments" },
            h("strong", null, "친구들의 한마디"),
            h("span", { className: "detail-comment-count" }, friendMessages.length)
          ),
          h(
            "div",
            { className: "detail-comment-list" },
            ...friendMessages.map((message) =>
              h(
                "article",
                {
                  key: message.id,
                  className: `detail-comment-item ${message.accent}`
                },
                message.name
                  ? h("div", { className: "detail-comment-author" }, message.name)
                  : null,
                h("div", { className: "detail-comment-bubble" }, message.text),
                h("span", { className: "detail-comment-time" }, message.time)
              )
            )
          )
        ),
        h(
          "div",
          { className: "detail-actions" },
          h(
            "button",
            {
              type: "button",
              className: `detail-action-icon ${place.saved ? "active" : ""}`,
              onClick: () => onToggleSave(place.id),
              "aria-label": "내 리스트에 저장"
            },
            h(HeartIcon, { className: "button-icon", filled: place.saved })
          ),
          h(
            "button",
            {
              type: "button",
              className: "detail-action-pill detail-action-pill-primary",
              onClick: onShowMap
            },
            h(MapPinIcon, { className: "button-icon" }),
            "우리지도"
          ),
          h(
            "button",
            {
              type: "button",
              className: "detail-action-pill detail-action-pill-muted"
            },
            "네이버 지도"
          )
        )
      )
    )
  );
}
