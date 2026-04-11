import { getCategoryById } from "../lib/api.js";
import { ArrowLeftIcon, HeartIcon, MapPinIcon, TrashIcon } from "./Icons.js";
import { PlaceImage } from "./PlaceImage.js";

const { createElement: h, useMemo, useState } = window.React;

function buildFriendMessages(place) {
  const seededMessages = [
    {
      id: `${place.id}-primary`,
      name: place.friendName,
      text: place.friendNote,
      time: String(place.createdLabel || "방금 추천").replace("저장", "추천"),
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

  const extraMessages = Array.isArray(place.comments) ? place.comments : [];

  return [...seededMessages, ...extraMessages];
}

export function PlaceDetailSheet({
  place,
  onAddComment,
  onClose,
  onDeletePlace,
  onToggleSave,
  onShowMap
}) {
  const category = getCategoryById(place.category);
  const friendMessages = useMemo(() => buildFriendMessages(place), [place]);
  const [draftComment, setDraftComment] = useState("");

  function handleSubmitComment(event) {
    event.preventDefault();

    const normalized = draftComment.trim();

    if (!normalized) {
      return;
    }

    onAddComment(place.id, normalized);
    setDraftComment("");
  }

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
                  className: `detail-comment-item ${message.accent || "left"}`
                },
                message.name
                  ? h("div", { className: "detail-comment-author" }, message.name)
                  : null,
                h("div", { className: "detail-comment-bubble" }, message.text),
                h("span", { className: "detail-comment-time" }, message.time)
              )
            )
          ),
          h(
            "form",
            {
              className: "detail-chat-form",
              onSubmit: handleSubmitComment
            },
            h("input", {
              className: "detail-chat-input",
              type: "text",
              value: draftComment,
              onInput: (event) => setDraftComment(event.target.value),
              placeholder: "한마디 남겨보세요"
            }),
            h(
              "button",
              {
                type: "submit",
                className: "detail-chat-send",
                disabled: !draftComment.trim()
              },
              "입력"
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
          ),
          h(
            "button",
            {
              type: "button",
              className: "detail-action-icon",
              onClick: () => onDeletePlace(place.id),
              "aria-label": "장소 삭제"
            },
            h(TrashIcon, { className: "button-icon" })
          )
        )
      )
    )
  );
}
