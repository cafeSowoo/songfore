import { getCategoryById } from "../lib/api.js";
import { MapPinIcon } from "./Icons.js";

const { createElement: h } = window.React;

export function DiscoveryMap({
  places,
  activeFilter,
  focusedPlaceId,
  onFocusPlace,
  onClearFocus,
  onOpenPlace
}) {
  const focusedPlaces = focusedPlaceId
    ? places.filter((place) => place.id === focusedPlaceId)
    : places;
  const cardPlaces = focusedPlaceId
    ? places.filter((place) => place.id === focusedPlaceId)
    : places.slice(0, 3);

  return h(
    "section",
    { className: "map-section" },
    h(
      "div",
      { className: "section-head" },
      h(
        "div",
        null,
        h("span", { className: "eyebrow subtle" }, "Discovery map"),
        h(
          "h3",
          null,
          focusedPlaceId
            ? "선택한 장소만 지도에 남겼어요"
            : activeFilter === "all"
              ? "여행 동선으로 보는 후보 맵"
              : "선택한 카테고리만 지도에서 보고 있어요"
        )
      ),
      focusedPlaceId
        ? h(
            "button",
            {
              type: "button",
              className: "map-reset-button",
              onClick: onClearFocus
            },
            "전체 보기"
          )
        : h("span", { className: "tiny-note" }, `${places.length}개 장소가 지도에 떠 있어요`)
    ),
    h(
      "div",
      { className: "map-viewport" },
      h("div", { className: "map-glow map-glow-one" }),
      h("div", { className: "map-glow map-glow-two" }),
      h(
        "div",
        { className: "map-river" },
        h("span", null, "갑천 라인")
      ),
      ...focusedPlaces.map((place) => {
        const category = getCategoryById(place.category);

        return h(
          "button",
          {
            key: place.id,
            type: "button",
            className: `map-marker ${focusedPlaceId === place.id ? "active" : ""}`,
            style: {
              top: place.mapPosition?.top || "50%",
              left: place.mapPosition?.left || "50%",
              "--marker-tone": category.tone
            },
            onClick: () => onOpenPlace(place.id)
          },
          h(MapPinIcon, { className: "map-marker-icon" }),
          h("span", null, place.name)
        );
      })
    ),
    h(
      "div",
      { className: "map-card-stack" },
      ...cardPlaces.map((place) =>
        h(
          "button",
          {
            key: place.id,
            type: "button",
            className: `map-summary-card ${focusedPlaceId === place.id ? "active" : ""}`,
            onClick: () => onFocusPlace(place.id)
          },
          h("strong", null, place.name),
          h("p", null, place.reason),
          h("span", null, `${place.friendName} 추천 · ${place.address}`)
        )
      )
    )
  );
}
