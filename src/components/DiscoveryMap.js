import { getCategoryById } from "../lib/api.js";
import { loadNaverMapsSdk } from "../lib/naverMaps.js";
import { MapPinIcon } from "./Icons.js";

const { createElement: h, useEffect, useMemo, useRef, useState } = window.React;

const MAP_CENTER = { latitude: 36.3504119, longitude: 127.3845475 };
const CATEGORY_MARKER_COLORS = {
  cafe: "#2d8f6f",
  restaurant: "#ff6d33",
  tour: "#2f80ed",
  shopping: "#8465d1",
  etc: "#6b7b73"
};

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(left, right) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(Number(right.latitude) - Number(left.latitude));
  const lngDelta = toRadians(Number(right.longitude) - Number(left.longitude));
  const startLat = toRadians(Number(left.latitude));
  const endLat = toRadians(Number(right.latitude));
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function getViewportPlaces(places) {
  if (places.length <= 2) {
    return places;
  }

  const medianPoint = {
    latitude: getMedian(places.map((place) => Number(place.latitude))),
    longitude: getMedian(places.map((place) => Number(place.longitude)))
  };
  const placesWithDistance = places
    .map((place) => ({
      place,
      distanceKm: getDistanceKm(place, medianPoint)
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
  const upperQuartileIndex = Math.min(
    placesWithDistance.length - 1,
    Math.max(1, Math.floor((placesWithDistance.length - 1) * 0.75))
  );
  const baseDistance = placesWithDistance[upperQuartileIndex]?.distanceKm || 0;
  const thresholdKm = Math.max(8, baseDistance * 2.5);
  const clusteredPlaces = placesWithDistance
    .filter((entry) => entry.distanceKm <= thresholdKm)
    .map((entry) => entry.place);

  return clusteredPlaces.length >= 2 ? clusteredPlaces : places;
}

function hasCoordinates(place) {
  return (
    Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude))
  );
}

function getMarkerColor(categoryId, isActive) {
  if (isActive) {
    return "#153328";
  }

  return CATEGORY_MARKER_COLORS[categoryId] || CATEGORY_MARKER_COLORS.etc;
}

function getMapSummaryCopy(place) {
  const recommendationNote = String(place.friendNote || place.description || "").trim();

  if (recommendationNote) {
    return recommendationNote;
  }

  const firstComment = Array.isArray(place.comments)
    ? place.comments.find((comment) => String(comment?.text || "").trim())
    : null;

  if (firstComment) {
    return String(firstComment.text).trim();
  }

  return String(place.reason || "").trim();
}

function createMarkerIcon(naver, place, isActive) {
  const size = isActive ? 26 : 20;
  const fill = getMarkerColor(place.category, isActive);
  const label = String(place.name || "").trim();
  const labelFontSize = isActive ? 13 : 12;
  const labelPaddingX = isActive ? 10 : 9;

  return {
    content: `
      <div style="
        transform: translate(-50%, -50%);
        display: grid;
        justify-items: center;
        gap: 8px;
      ">
        <div style="
          max-width: 132px;
          padding: 6px ${labelPaddingX}px;
          border-radius: 999px;
          background: rgba(255, 252, 248, 0.94);
          color: #153328;
          font-size: ${labelFontSize}px;
          font-weight: 800;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
        ">${label}</div>
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 999px;
          border: 3px solid #ffffff;
          background: ${fill};
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.24);
        "></div>
      </div>
    `,
    anchor: new naver.maps.Point(size / 2, size + 32)
  };
}

function DiscoveryMapFallback({
  places,
  focusedPlaceId,
  onClearFocus,
  onOpenPlace
}) {
  return [
    h("div", { key: "glow-one", className: "map-glow map-glow-one" }),
    h("div", { key: "glow-two", className: "map-glow map-glow-two" }),
    focusedPlaceId
      ? h(
          "button",
          {
            key: "reset",
            type: "button",
            className: "map-reset-button map-reset-floating",
            onClick: onClearFocus
          },
          "전체 보기"
        )
      : null,
    h(
      "div",
      { key: "river", className: "map-river" },
      h("span", null, "갑천 라인")
    ),
    ...places.map((place) => {
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
  ];
}

export function DiscoveryMap({
  places,
  focusedPlaceId,
  mapsClientId = "",
  onFocusPlace,
  onClearFocus,
  onOpenPlace
}) {
  const mapRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("");
  const [isRealMapVisible, setIsRealMapVisible] = useState(false);

  const mapPlaces = useMemo(
    () => (focusedPlaceId ? places.filter((place) => place.id === focusedPlaceId) : places),
    [focusedPlaceId, places]
  );
  const cardPlaces = useMemo(
    () => (focusedPlaceId ? places.filter((place) => place.id === focusedPlaceId) : places),
    [focusedPlaceId, places]
  );
  const coordinatePlaces = useMemo(
    () => mapPlaces.filter(hasCoordinates),
    [mapPlaces]
  );
  const viewportPlaces = useMemo(
    () => (focusedPlaceId ? coordinatePlaces : getViewportPlaces(coordinatePlaces)),
    [coordinatePlaces, focusedPlaceId]
  );
  const mapSignature = useMemo(
    () =>
      coordinatePlaces
        .map(
          (place) =>
            `${place.id}:${Number(place.latitude).toFixed(6)}:${Number(place.longitude).toFixed(6)}:${place.category}`
        )
        .join("|"),
    [coordinatePlaces]
  );

  useEffect(() => {
    let cancelled = false;

    async function renderRealMap() {
      setIsRealMapVisible(false);

      if (!mapsClientId) {
        setMapStatus("네이버 지도 키가 연결되면 이 화면도 실제 지도로 보여드릴게요.");
        return;
      }

      if (!mapRef.current || coordinatePlaces.length === 0) {
        setMapStatus(
          places.length
            ? "좌표가 있는 장소부터 실제 지도로 보여드릴게요."
            : ""
        );
        return;
      }

      try {
        const naver = await loadNaverMapsSdk(mapsClientId);

        if (cancelled || !mapRef.current || !naver?.maps?.Map) {
          return;
        }

        const target = mapRef.current;
        target.replaceChildren();
        target.hidden = false;

        const selectedPlace =
          coordinatePlaces.find((place) => place.id === focusedPlaceId) || coordinatePlaces[0];
        const map = new naver.maps.Map(target, {
          center: new naver.maps.LatLng(
            selectedPlace?.latitude || MAP_CENTER.latitude,
            selectedPlace?.longitude || MAP_CENTER.longitude
          ),
          zoom: focusedPlaceId ? 16 : 14,
          zoomControl: true,
          mapDataControl: false,
          scaleControl: false,
          logoControl: false
        });

        coordinatePlaces.forEach((place) => {
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(place.latitude, place.longitude),
            map,
            title: place.name,
            icon: createMarkerIcon(naver, place, place.id === focusedPlaceId)
          });

          naver.maps.Event.addListener(marker, "click", () => onOpenPlace(place.id));
        });

        if (!focusedPlaceId) {
          if (viewportPlaces.length > 1) {
            const bounds = new naver.maps.LatLngBounds();

            viewportPlaces.forEach((place) =>
              bounds.extend(new naver.maps.LatLng(place.latitude, place.longitude))
            );

            map.fitBounds(bounds, {
              top: 18,
              right: 18,
              bottom: 18,
              left: 18
            });
          } else if (selectedPlace) {
            map.setCenter(
              new naver.maps.LatLng(selectedPlace.latitude, selectedPlace.longitude)
            );
            map.setZoom(16);
          }
        }

        const syncMapSize = () => {
          if (!target.isConnected) {
            return;
          }

          const width = Math.max(target.offsetWidth || target.clientWidth, 280);
          const height = Math.max(target.offsetHeight || target.clientHeight, 240);
          map.setSize(new naver.maps.Size(width, height));
          map.autoResize();
        };

        window.requestAnimationFrame(() => {
          syncMapSize();
          if (!focusedPlaceId && viewportPlaces.length > 1) {
            const bounds = new naver.maps.LatLngBounds();

            viewportPlaces.forEach((place) =>
              bounds.extend(new naver.maps.LatLng(place.latitude, place.longitude))
            );

            map.fitBounds(bounds, {
              top: 18,
              right: 18,
              bottom: 18,
              left: 18
            });
          }
          window.requestAnimationFrame(syncMapSize);
        });

        window.setTimeout(syncMapSize, 160);

        setMapStatus("");
        setIsRealMapVisible(true);
      } catch (error) {
        if (!cancelled) {
          setMapStatus("실제 지도를 불러오지 못해 위치 프리뷰를 유지하고 있어요.");
          setIsRealMapVisible(false);
        }
        console.warn("Failed to render discovery map.", error);
      }
    }

    renderRealMap();

    return () => {
      cancelled = true;
    };
  }, [coordinatePlaces, focusedPlaceId, mapSignature, mapsClientId, places.length, viewportPlaces]);

  return h(
    "section",
    { className: "map-section" },
    h(
      "div",
      { className: `map-viewport ${isRealMapVisible ? "is-live" : ""}` },
      h("div", {
        ref: mapRef,
        className: `map-real-layer ${isRealMapVisible ? "is-ready" : ""}`,
        "aria-label": "여행 지도"
      }),
      !isRealMapVisible
        ? h(DiscoveryMapFallback, {
            places: mapPlaces,
            focusedPlaceId,
            onClearFocus,
            onOpenPlace
          })
        : focusedPlaceId
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
      mapStatus
        ? h("p", { className: "map-status-chip" }, mapStatus)
        : null
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
          h("p", null, getMapSummaryCopy(place)),
          h("span", null, `${place.friendName} 추천 · ${place.address}`)
        );
      })
    )
  );
}
