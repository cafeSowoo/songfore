import { getCategoryById } from "../lib/api.js";
import { MapPinIcon } from "./Icons.js";

const { createElement: h } = window.React;

export function DiscoveryMap({
  places,
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
    : places;

  return h(
    "section",
    { className: "map-section" },
    h(
      "div",
      { className: "map-viewport" },
      h("div", { className: "map-glow map-glow-one" }),
      h("div", { className: "map-glow map-glow-two" }),
      focusedPlaceId
        ? h(
            "button",
            {
              type: "button",
              className: "map-reset-button map-reset-floating",
              onClick: onClearFocus
            },
            "전체 보기"
          )
        : null,
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
      ...cardPlaces.map((place) => {
        const category = getCategoryById(place.category);

        return h(
          "button",
          {
            key: place.id,
            type: "button",
            className: `map-summary-card ${focusedPlaceId === place.id ? "active" : ""}`,
            style: { "--summary-tone": category.tone },
            onClick: () => onFocusPlace(place.id)
          },
          h("strong", null, place.name),
          h("p", null, place.reason),
          h("span", null, `${place.friendName} 추천 · ${place.address}`)
        );
      })
    )
  );
}
