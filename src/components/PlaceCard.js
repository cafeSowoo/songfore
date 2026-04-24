import { getCategoryById } from "../lib/api.js";
import { HeartIcon, MapPinIcon } from "./Icons.js";
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

function getFriendInitial(name) {
  const normalized = String(name || "").trim();
  return normalized ? normalized.slice(0, 1) : "친";
}

export function PlaceCard({
  place,
  scheduleBadge,
  variant = "featured",
  className = "",
  style = null,
  showSave = true,
  compactAction = null,
  onOpen,
  onToggleSave
}) {
  const category = getCategoryById(place.category);
  const isCompact = variant === "compact";

  return h(
    "article",
    {
      className: `place-card place-card-${variant} ${className}`.trim(),
      style,
      onClick: () => onOpen(place.id)
    },
    h(PlaceImage, {
      src: place.imageUrl,
      alt: place.name,
      className: "place-card-image-frame",
      overlay: h(
        "div",
        { className: "place-card-overlay-grid" },
        scheduleBadge && !isCompact
          ? h(
              "div",
              { className: "place-schedule-badge" },
              h("span", { className: "place-schedule-day" }, scheduleBadge.day),
              h("span", { className: "place-schedule-time" }, scheduleBadge.time)
            )
          : null,
        showSave
          ? h(
              "button",
              {
                type: "button",
                className: `save-toggle-button ${place.saved ? "active" : ""}`,
                onClick: (event) => {
                  event.stopPropagation();
                  onToggleSave?.(place.id);
                },
                "aria-label": place.saved ? "좋아요 취소" : "좋아요"
              },
              h(HeartIcon, {
                className: "save-icon",
                filled: place.saved
              })
            )
          : null,
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
          h("h3", null, place.name),
          h(
            "span",
            {
              className: "place-card-category",
              style: { "--category-tone": category.tone }
            },
            category.label
          )
        ),
        h(
          "span",
          { className: "place-time" },
          toRecommendedLabel(place.createdLabel, place.friendName)
        )
      ),
      isCompact && showSave
        ? h(
            "button",
            {
              type: "button",
              className: `save-toggle-button place-card-body-save ${place.saved ? "active" : ""}`,
              onClick: (event) => {
                event.stopPropagation();
                onToggleSave?.(place.id);
              },
              "aria-label": place.saved ? "좋아요 취소" : "좋아요"
            },
            h(HeartIcon, {
              className: "save-icon",
              filled: place.saved
            })
          )
        : compactAction,
      h(
        "p",
        { className: "place-card-address" },
        h(MapPinIcon, { className: "place-card-address-icon" }),
        h("span", null, place.address)
      ),
      place.friendNote
        ? h(
            "p",
            {
              className: "friend-note",
              style: { "--note-tone": category.tone }
            },
            isCompact
              ? [
                  h("span", { key: "avatar", className: "friend-note-avatar" }, getFriendInitial(place.friendName)),
                  h(
                    "span",
                    { key: "copy", className: "friend-note-copy" },
                    h("strong", null, place.friendName || "친구"),
                    h("span", null, place.friendNote)
                  )
                ]
              : `"${place.friendNote}"`
          )
        : null
    )
  );
}
