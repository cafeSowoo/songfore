import { getCategoryById, resolvePlaceNaverLink } from "../lib/api.js";
import { loadNaverMapsSdk, searchAddressCandidates } from "../lib/naverMaps.js";
import { ArrowLeftIcon, HeartIcon, MapPinIcon, TrashIcon } from "./Icons.js";
import { PlaceImage } from "./PlaceImage.js";

const { createElement: h, useEffect, useMemo, useRef, useState } = window.React;
const NAVER_MAP_APP_NAME = "com.songfore.dajeonstargram";

function buildFriendMessages(place) {
  const seededMessages = [];

  if (place.friendNote) {
    seededMessages.push({
      id: `${place.id}-primary`,
      name: place.friendName,
      text: place.friendNote,
      time: String(place.createdLabel || "방금 추천").replace("저장", "추천"),
      accent: "left"
    });
  }

  const extraMessages = Array.isArray(place.comments) ? place.comments : [];

  return [...seededMessages, ...extraMessages];
}

function formatMessageMetaLabel(value) {
  const label = String(value || "").trim();

  if (!label) {
    return "";
  }

  return label.replace(/^.+?[이가]\s+/, "");
}

function normalizeNaverDetailLink(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  const isAllowedHost = (candidate) =>
    /^(https?:)?\/\/(naver\.me|map\.naver\.com)(\/|$)/i.test(candidate);

  if (/^https?:\/\//i.test(raw)) {
    return isAllowedHost(raw) ? raw : "";
  }

  if (raw.startsWith("//")) {
    return isAllowedHost(raw) ? `https:${raw}` : "";
  }

  if (/^map\.naver\.com\//i.test(raw)) {
    return `https://${raw}`;
  }

  if (/^naver\.me\//i.test(raw)) {
    return `https://${raw}`;
  }

  if (raw.startsWith("/")) {
    return `https://map.naver.com${raw}`;
  }

  return "";
}

function buildNaverMapUrl(place) {
  const directLink = normalizeNaverDetailLink(place.naverLink);

  if (directLink) {
    return directLink;
  }

  const query = String(place.name || place.address || "").trim();

  return query
    ? `https://map.naver.com/p/search/${encodeURIComponent(query)}`
    : "https://map.naver.com/p/";
}

function buildNaverAppUrl(place) {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  const name = String(place.name || "").trim();
  const query = String(place.address || place.name || "").trim();
  const appName = encodeURIComponent(NAVER_MAP_APP_NAME);

  if (Number.isFinite(latitude) && Number.isFinite(longitude) && name) {
    return `nmap://place?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(
      longitude
    )}&name=${encodeURIComponent(name)}&appname=${appName}`;
  }

  if (query) {
    return `nmap://search?query=${encodeURIComponent(query)}&appname=${appName}`;
  }

  return `nmap://map?appname=${appName}`;
}

function buildAndroidIntentUrl(appUrl) {
  return appUrl.replace(/^nmap:\/\//, "intent://") +
    "#Intent;scheme=nmap;package=com.nhn.android.nmap;end";
}

function isAndroidDevice() {
  return /android/i.test(window.navigator.userAgent || "");
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
}

function openBlankExternalWindow() {
  const externalWindow = window.open("", "_blank");

  if (externalWindow) {
    externalWindow.opener = null;
  }

  return externalWindow;
}

function openExternalUrl(url, externalWindow = null) {
  if (externalWindow && !externalWindow.closed) {
    externalWindow.location.href = url;
    return;
  }

  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

  if (!openedWindow) {
    window.location.assign(url);
  }
}

function DetailLocationMap({ place, mapsClientId = "" }) {
  const mapRef = useRef(null);
  const [resolvedPoint, setResolvedPoint] = useState(null);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolvePoint() {
      const latitude = Number(place.latitude);
      const longitude = Number(place.longitude);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setResolvedPoint({ latitude, longitude });
        return;
      }

      if (!mapsClientId) {
        setResolvedPoint(null);
        return;
      }

      try {
        const candidates = await searchAddressCandidates(place.address || place.name, mapsClientId);

        if (cancelled) {
          return;
        }

        const firstCandidate = candidates[0];
        if (firstCandidate) {
          setResolvedPoint({
            latitude: Number(firstCandidate.latitude),
            longitude: Number(firstCandidate.longitude)
          });
          setRenderError("");
          return;
        }
      } catch (error) {
        console.warn("Failed to resolve detail map coordinates.", error);
      }

      if (!cancelled) {
        setResolvedPoint(null);
      }
    }

    setRenderError("");
    setResolvedPoint(null);
    resolvePoint();

    return () => {
      cancelled = true;
    };
  }, [mapsClientId, place]);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!mapRef.current || !mapsClientId || !resolvedPoint) {
        return;
      }

      try {
        const naver = await loadNaverMapsSdk(mapsClientId);

        if (cancelled || !mapRef.current || !naver?.maps?.Map) {
          return;
        }

        const target = mapRef.current;
        const position = new naver.maps.LatLng(resolvedPoint.latitude, resolvedPoint.longitude);
        target.replaceChildren();

        const map = new naver.maps.Map(target, {
          center: position,
          zoom: 16,
          zoomControl: false,
          mapDataControl: false,
          scaleControl: false,
          logoControl: false,
          draggable: false,
          scrollWheel: false,
          disableDoubleTapZoom: true,
          pinchZoom: false,
          keyboardShortcuts: false
        });

        new naver.maps.Marker({
          position,
          map
        });

        window.requestAnimationFrame(() => {
          if (!target.isConnected) {
            return;
          }

          const width = Math.max(target.clientWidth, 280);
          const height = Math.max(target.clientHeight, 160);
          map.setSize(new naver.maps.Size(width, height));
          map.autoResize();
        });

        setRenderError("");
      } catch (error) {
        if (!cancelled) {
          setRenderError("지도를 불러오지 못해 위치 프리뷰로 표시하고 있어요.");
        }
        console.warn("Failed to render detail map.", error);
      }
    }

    renderMap();

    return () => {
      cancelled = true;
    };
  }, [mapsClientId, resolvedPoint]);

  const showRealMap = Boolean(mapsClientId && resolvedPoint);

  return h(
    "div",
    {
      className: `detail-location-map ${showRealMap ? "is-live" : ""}`
    },
    h("div", {
      ref: mapRef,
      className: "detail-location-real-map",
      hidden: !showRealMap,
      "aria-label": `${place.name} 위치 지도`
    }),
    !showRealMap ? h("div", { className: "detail-location-grid" }) : null,
    !showRealMap
      ? h(
          "div",
          {
            className: "detail-location-pin"
          },
          h(MapPinIcon, { className: "button-icon" })
        )
      : null,
    !mapsClientId || renderError
      ? h(
          "p",
          { className: "detail-location-status" },
          renderError || "네이버 지도 키가 연결되면 여기서 실제 위치를 바로 보여드릴게요."
        )
      : null
  );
}

export function PlaceDetailSheet({
  place,
  mapsClientId = "",
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

  async function handleOpenNaverMap(event) {
    event.preventDefault();

    const shouldOpenInApp = isAndroidDevice() || isIosDevice();
    const externalWindow = shouldOpenInApp ? null : openBlankExternalWindow();
    let detailUrl = normalizeNaverDetailLink(place.naverLink);

    if (!detailUrl) {
      try {
        const payload = await resolvePlaceNaverLink({
          name: place.name,
          address: place.address
        });
        detailUrl = normalizeNaverDetailLink(payload?.naverLink);
      } catch (error) {
        console.warn("Failed to resolve Naver place detail link on demand.", error);
      }
    }

    const webUrl = detailUrl || buildNaverMapUrl(place);
    if (shouldOpenInApp) {
      if (detailUrl) {
        window.location.assign(detailUrl);
        return;
      }

      const appUrl = buildNaverAppUrl(place);
      let fallbackTimer = 0;

      const cleanup = () => {
        if (fallbackTimer) {
          window.clearTimeout(fallbackTimer);
          fallbackTimer = 0;
        }

        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("pagehide", cleanup);
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          cleanup();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("pagehide", cleanup, { once: true });

      fallbackTimer = window.setTimeout(() => {
        cleanup();
        window.location.assign(webUrl);
      }, 900);

      window.location.assign(isAndroidDevice() ? buildAndroidIntentUrl(appUrl) : appUrl);
      return;
    }

    openExternalUrl(webUrl, externalWindow);
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
          h(DetailLocationMap, { place, mapsClientId })
        ),
        h(
          "section",
          { className: "detail-comments" },
          h(
            "div",
            { className: "detail-section-head detail-section-head-comments" },
            h("strong", null, "친구들의 한마디"),
            h("span", { className: "detail-comment-count" }, `댓글 ${friendMessages.length}`)
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
                message.name || message.time
                  ? h(
                      "div",
                      { className: "detail-comment-meta" },
                      message.name
                        ? h("div", { className: "detail-comment-author" }, message.name)
                        : null,
                      message.time
                        ? h(
                            "span",
                            { className: "detail-comment-time" },
                            formatMessageMetaLabel(message.time)
                          )
                        : null
                    )
                  : null,
                h("div", { className: "detail-comment-bubble" }, message.text),
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
            "a",
            {
              className: "detail-action-pill detail-action-pill-muted",
              href: buildNaverMapUrl(place),
              onClick: handleOpenNaverMap,
              target: "_blank",
              rel: "noopener noreferrer"
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
