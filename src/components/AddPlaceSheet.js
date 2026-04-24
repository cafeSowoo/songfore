import {
  resolvePlaceNaverLink,
  searchPlaceCandidates,
  searchPlaceImageCandidates
} from "../lib/api.js";
import { loadNaverMapsSdk } from "../lib/naverMaps.js";
import { normalizeNaverMapLink } from "../lib/naverLinks.js";
import { CloseIcon, MapPinIcon } from "./Icons.js";

const { createElement: h, useEffect, useMemo, useRef, useState } = window.React;

const directInitialForm = {
  category: "cafe",
  name: "",
  address: "",
  reason: ""
};

const searchInitialState = {
  query: "",
  results: [],
  selectedPlace: null,
  category: "",
  reason: "",
  imageResults: [],
  selectedImageUrl: "",
  imageErrorMessage: "",
  isSearchingImages: false,
  isResolvingDetailLink: false,
  isSearching: false,
  hasSearched: false,
  errorMessage: ""
};

function SubmitButton({ disabled = false, isLoading = false, label = "등록하기" }) {
  return h(
    "button",
    {
      type: "submit",
      className: `submit-button ${isLoading ? "is-loading" : ""}`,
      disabled,
      "aria-busy": isLoading ? "true" : "false"
    },
    isLoading ? h("span", { className: "submit-spinner", "aria-hidden": "true" }) : null,
    h("span", null, label)
  );
}

function PlaceSearchPreviewMap({ place, mapsClientId }) {
  const mapRef = useRef(null);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!place || !mapRef.current || !mapsClientId) {
        return;
      }

      try {
        setRenderError("");
        const naver = await loadNaverMapsSdk(mapsClientId);

        if (cancelled || !mapRef.current || !naver?.maps?.Map) {
          return;
        }

        const target = mapRef.current;
        const position = new naver.maps.LatLng(place.latitude, place.longitude);
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

        window.requestAnimationFrame(() => {
          if (!target.isConnected) {
            return;
          }

          const width = Math.max(target.clientWidth, 280);
          const height = Math.max(target.clientHeight, 168);
          map.setSize(new naver.maps.Size(width, height));
          map.autoResize();
        });
      } catch (error) {
        if (!cancelled) {
          setRenderError(
            "지도 미리보기를 불러오지 못했어요. 브라우저 차단 설정이나 네이버 지도 허용 URL을 확인해 주세요."
          );
        }
        console.warn("Failed to render place search preview map.", error);
      }
    }

    renderMap();

    return () => {
      cancelled = true;
    };
  }, [mapsClientId, place]);

  if (!place) {
    return null;
  }

  if (!mapsClientId) {
    return h(
      "div",
      { className: "add-search-preview-map add-search-preview-map-fallback" },
      h(MapPinIcon, { className: "button-icon" }),
      h("span", null, "지도 미리보기는 배포 환경에서 자동으로 보여드릴게요.")
    );
  }

  if (renderError) {
    return h(
      "div",
      { className: "add-search-preview-map add-search-preview-map-fallback" },
      h(MapPinIcon, { className: "button-icon" }),
      h("span", null, renderError)
    );
  }

  return h(
    "div",
    {
      className: "add-search-preview-map-shell"
    },
    h("div", {
      ref: mapRef,
      className: "add-search-preview-map",
      "aria-label": `${place.name} 위치 미리보기`
    }),
    h(
      "div",
      { className: "add-search-preview-pin", "aria-hidden": "true" },
      h(MapPinIcon, { className: "button-icon" })
    )
  );
}

function SearchResultCard({ place, isActive, onSelect }) {
  return h(
    "button",
    {
      type: "button",
      className: `add-search-result ${isActive ? "active" : ""}`,
      onClick: () => onSelect(place)
    },
    h(
      "div",
      { className: "add-search-result-copy" },
      h("strong", null, place.name),
      h("span", null, place.category || "장소"),
      h("p", null, place.address)
    ),
    place.distanceLabel
      ? h("span", { className: "add-search-distance" }, place.distanceLabel)
      : null
  );
}

export function AddPlaceSheet({ categories, mapsClientId = "", onClose, onSubmit }) {
  const [activeMode, setActiveMode] = useState("search");
  const [searchState, setSearchState] = useState(searchInitialState);
  const [directForm, setDirectForm] = useState(directInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectableCategories = useMemo(
    () => categories.filter((category) => category.id !== "all"),
    [categories]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchImageCandidates() {
      if (!searchState.selectedPlace) {
        return;
      }

      setSearchState((current) => ({
        ...current,
        imageResults: [],
        selectedImageUrl: "",
        imageErrorMessage: "",
        isSearchingImages: true
      }));

      try {
        const payload = await searchPlaceImageCandidates({
          name: searchState.selectedPlace.name,
          address: searchState.selectedPlace.address
        });

        if (cancelled) {
          return;
        }

        const suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
        setSearchState((current) => ({
          ...current,
          imageResults: suggestions,
          selectedImageUrl: suggestions[0]?.imageUrl || "",
          imageErrorMessage: suggestions.length
            ? ""
            : "대표사진 후보를 찾지 못해 기본 이미지를 사용할게요.",
          isSearchingImages: false
        }));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSearchState((current) => ({
          ...current,
          imageResults: [],
          selectedImageUrl: "",
          imageErrorMessage:
            error instanceof Error ? error.message : "사진 후보를 불러오지 못했어요.",
          isSearchingImages: false
        }));
      }
    }

    fetchImageCandidates();

    return () => {
      cancelled = true;
    };
  }, [searchState.selectedPlace]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDetailLink() {
      const selectedPlace = searchState.selectedPlace;

      if (!selectedPlace || String(selectedPlace.naverLink || "").trim()) {
        return;
      }

      setSearchState((current) => {
        if (!current.selectedPlace || current.selectedPlace.id !== selectedPlace.id) {
          return current;
        }

        return {
          ...current,
          isResolvingDetailLink: true
        };
      });

      try {
        const payload = await resolvePlaceNaverLink({
          name: selectedPlace.name,
          address: selectedPlace.roadAddress || selectedPlace.address
        });
        const resolvedLink = String(payload?.naverLink || "").trim();

        if (cancelled) {
          return;
        }

        if (!resolvedLink) {
          setSearchState((current) => ({
            ...current,
            isResolvingDetailLink: false
          }));
          return;
        }

        setSearchState((current) => {
          if (!current.selectedPlace || current.selectedPlace.id !== selectedPlace.id) {
            return current;
          }

          return {
            ...current,
            isResolvingDetailLink: false,
            selectedPlace: {
              ...current.selectedPlace,
              naverLink: resolvedLink
            },
            results: current.results.map((result) =>
              result.id === selectedPlace.id
                ? {
                    ...result,
                    naverLink: resolvedLink
                  }
                : result
            )
          };
        });
      } catch (error) {
        if (!cancelled) {
          setSearchState((current) => ({
            ...current,
            isResolvingDetailLink: false
          }));
          console.warn("Failed to resolve Naver place detail link.", error);
        }
      }
    }

    fetchDetailLink();

    return () => {
      cancelled = true;
    };
  }, [searchState.selectedPlace]);

  async function handleSearchSubmit(event) {
    event.preventDefault();
    const normalizedQuery = searchState.query.trim();

    if (!normalizedQuery) {
      return;
    }

    setSearchState((current) => ({
      ...current,
      isSearching: true,
      isResolvingDetailLink: false,
      hasSearched: true,
      errorMessage: ""
    }));

    try {
      const payload = await searchPlaceCandidates(normalizedQuery);
      const suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
      const mappedResults = suggestions.map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address || item.roadAddress || item.jibunAddress || normalizedQuery,
        roadAddress: item.roadAddress || "",
        jibunAddress: item.jibunAddress || "",
        naverLink: normalizeNaverMapLink(item.link),
        category: item.category || "",
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        distanceLabel: Number.isFinite(Number(item.distanceMeters))
          ? Number(item.distanceMeters) < 1000
            ? `${Math.round(Number(item.distanceMeters))}m`
            : `${(Number(item.distanceMeters) / 1000).toFixed(1)}km`
          : ""
      }));

      setSearchState((current) => ({
        ...current,
        isSearching: false,
        isResolvingDetailLink: false,
        results: mappedResults,
        selectedPlace: mappedResults[0] || null,
        category: "",
        imageResults: [],
        selectedImageUrl: "",
        imageErrorMessage: "",
        isSearchingImages: false,
        errorMessage: mappedResults.length ? "" : "검색 결과가 없어요. 직접 입력으로 바로 추가할 수 있어요."
      }));
    } catch (error) {
      setSearchState((current) => ({
        ...current,
        isSearching: false,
        isResolvingDetailLink: false,
        results: [],
        selectedPlace: null,
        category: "",
        imageResults: [],
        selectedImageUrl: "",
        imageErrorMessage: "",
        isSearchingImages: false,
        errorMessage:
          error instanceof Error ? error.message : "장소 검색에 실패했어요."
      }));
    }
  }

  async function handleSearchSave(event) {
    event.preventDefault();

    if (
      !searchState.selectedPlace ||
      !searchState.category ||
      !searchState.reason.trim() ||
      searchState.isResolvingDetailLink ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        category: searchState.category,
        name: searchState.selectedPlace.name,
        address: searchState.selectedPlace.address,
        reason: searchState.reason.trim(),
        description: searchState.reason.trim(),
        imageUrl: searchState.selectedImageUrl,
        naverLink: searchState.selectedPlace.naverLink,
        latitude: searchState.selectedPlace.latitude,
        longitude: searchState.selectedPlace.longitude,
        resolvedAddress:
          searchState.selectedPlace.roadAddress || searchState.selectedPlace.address
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDirectSave(event) {
    event.preventDefault();

    if (
      !directForm.name.trim() ||
      !directForm.address.trim() ||
      !directForm.reason.trim() ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        category: directForm.category,
        name: directForm.name.trim(),
        address: directForm.address.trim(),
        reason: directForm.reason.trim(),
        description: directForm.reason.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return h(
    "div",
    { className: "sheet-overlay warm", onClick: onClose },
    h(
      "section",
      {
        className: "add-sheet add-sheet-simple add-sheet-search-flow",
        onClick: (event) => event.stopPropagation()
      },
      h(
        "div",
        { className: "add-sheet-head add-sheet-head-simple" },
        h(
          "div",
          { className: "add-sheet-title-block" },
          h("h2", null, "새로운 장소 추가")
        ),
        h(
          "button",
          {
            type: "button",
            className: "sheet-close sheet-close-soft",
            onClick: onClose,
            "aria-label": "장소 추가 닫기"
          },
          h(CloseIcon, { className: "sheet-close-icon" })
        )
      ),
      h(
        "div",
        { className: "add-mode-switcher" },
        h(
          "button",
          {
            type: "button",
            className: `add-mode-tab ${activeMode === "search" ? "active" : ""}`,
            onClick: () => setActiveMode("search")
          },
          "장소 검색"
        ),
        h(
          "button",
          {
            type: "button",
            className: `add-mode-tab ${activeMode === "direct" ? "active" : ""}`,
            onClick: () => setActiveMode("direct")
          },
          "직접 입력"
        )
      ),
      activeMode === "search"
        ? h(
            "div",
            { className: "add-search-layout" },
            h(
              "form",
              { className: "add-search-bar", onSubmit: handleSearchSubmit },
              h("input", {
                type: "search",
                value: searchState.query,
                onInput: (event) =>
                  setSearchState((current) => ({
                    ...current,
                    query: event.target.value
                  })),
                placeholder: "예: 성심당, 한밭수목원, 소제동",
                "aria-label": "장소 검색"
              }),
              h(
                "button",
                {
                  type: "submit",
                  className: "ghost-button add-search-button",
                  disabled: searchState.isSearching
                },
                searchState.isSearching ? "검색 중" : "검색"
              )
            ),
            h(
              "div",
              { className: "add-search-content" },
              searchState.results.length || searchState.hasSearched
                ? h(
                    "div",
                    { className: "add-search-results" },
                    searchState.results.length
                      ? h(
                          "div",
                          { className: "add-search-result-list" },
                          ...searchState.results.map((place) =>
                            h(SearchResultCard, {
                              key: place.id,
                              place,
                              isActive: searchState.selectedPlace?.id === place.id,
                              onSelect: (selectedPlace) =>
                                setSearchState((current) => ({
                                  ...current,
                                  selectedPlace
                                }))
                            })
                          )
                        )
                      : h(
                          "div",
                          { className: "add-search-empty" },
                          h("strong", null, "원하는 장소가 안 보이나요?"),
                          h(
                            "p",
                            null,
                            searchState.errorMessage ||
                              "검색 결과가 없으면 직접 입력 탭에서 바로 추가할 수 있어요."
                          )
                        )
                  )
                : null,
              searchState.selectedPlace
                ? h(
                    "form",
                    { className: "add-search-preview-card", onSubmit: handleSearchSave },
                    [
                      h(
                        "div",
                        { key: "head", className: "add-search-preview-copy" },
                        h("span", { className: "eyebrow subtle" }, "선택한 장소"),
                        h("strong", null, searchState.selectedPlace.name)
                      ),
                      h(PlaceSearchPreviewMap, {
                        key: "map",
                        place: searchState.selectedPlace,
                        mapsClientId
                      }),
                      h(
                        "div",
                        { key: "images", className: "field" },
                        h("span", { className: "field-label" }, "대표사진 선택"),
                        searchState.isSearchingImages
                          ? h(
                              "div",
                              { className: "add-search-image-empty" },
                              h("p", null, "사진 후보를 불러오는 중이에요.")
                            )
                          : searchState.imageResults.length
                            ? h(
                                "div",
                                { className: "add-search-image-list" },
                                ...searchState.imageResults.map((image) =>
                                  h(
                                    "button",
                                    {
                                      key: image.id,
                                      type: "button",
                                      className: `add-search-image-option ${
                                        searchState.selectedImageUrl === image.imageUrl ? "active" : ""
                                      }`,
                                      onClick: () =>
                                        setSearchState((current) => ({
                                          ...current,
                                          selectedImageUrl: image.imageUrl
                                        })),
                                      "aria-label": `${image.title} 대표사진 선택`
                                    },
                                    h("img", {
                                      src: image.thumbnailUrl || image.imageUrl,
                                      alt: image.title,
                                      loading: "lazy"
                                    })
                                  )
                                )
                              )
                            : h(
                                "div",
                                { className: "add-search-image-empty" },
                                h(
                                  "p",
                                  null,
                                  searchState.imageErrorMessage ||
                                    "사진 후보를 찾지 못했어요. 기본 이미지를 사용할게요."
                                )
                              )
                      ),
                      h(
                        "label",
                        { key: "reason", className: "field" },
                        h("span", { className: "field-label" }, "한줄 추천 이유"),
                        h("input", {
                          type: "text",
                          value: searchState.reason,
                          onInput: (event) =>
                            setSearchState((current) => ({
                              ...current,
                              reason: event.target.value
                            })),
                          placeholder: "왜 우리 여행에 어울리는지 짧게 적어주세요",
                          required: true
                        })
                      ),
                      h(
                        "div",
                        { key: "category", className: "field" },
                        h("span", { className: "field-label" }, "분류 카테고리"),
                        h(
                          "div",
                          { className: "category-chip-row" },
                          ...selectableCategories.map((category) =>
                            h(
                              "button",
                              {
                                key: category.id,
                                type: "button",
                                className: `category-select-chip ${
                                  searchState.category === category.id ? "active" : ""
                                }`,
                                style: { "--chip-tone": category.tone },
                                onClick: () =>
                                  setSearchState((current) => ({
                                    ...current,
                                    category: category.id
                                  }))
                              },
                              category.label
                            )
                          )
                        )
                      ),
                      h(SubmitButton, {
                        key: "submit",
                        disabled:
                          !searchState.selectedPlace ||
                          !searchState.category ||
                          !searchState.reason.trim() ||
                          searchState.isResolvingDetailLink ||
                          isSubmitting,
                        isLoading: searchState.isResolvingDetailLink || isSubmitting,
                        label: searchState.isResolvingDetailLink
                          ? "링크 확인 중..."
                          : isSubmitting
                            ? "저장 중..."
                          : "등록하기"
                      })
                    ]
                  )
                : null
            )
          )
        : h(
            "form",
            { className: "add-form add-form-simple", onSubmit: handleDirectSave },
            h(
              "div",
              { className: "field" },
              h("span", { className: "field-label" }, "카테고리"),
              h(
                "div",
                { className: "category-chip-row" },
                ...selectableCategories.map((category) =>
                  h(
                    "button",
                    {
                      key: category.id,
                      type: "button",
                      className: `category-select-chip ${
                        directForm.category === category.id ? "active" : ""
                      }`,
                      style: { "--chip-tone": category.tone },
                      onClick: () =>
                        setDirectForm((current) => ({
                          ...current,
                          category: category.id
                        }))
                    },
                    category.label
                  )
                )
              )
            ),
            h(
              "label",
              { className: "field" },
              h("span", { className: "field-label" }, "장소명"),
              h("input", {
                value: directForm.name,
                onInput: (event) =>
                  setDirectForm((current) => ({
                    ...current,
                    name: event.target.value
                  })),
                placeholder: "예: 대전근현대사전시관",
                required: true
              })
            ),
            h(
              "label",
              { className: "field" },
              h("span", { className: "field-label" }, "주소 또는 지역"),
              h("input", {
                value: directForm.address,
                onInput: (event) =>
                  setDirectForm((current) => ({
                    ...current,
                    address: event.target.value
                  })),
                placeholder: "예: 대전 중구 은행동",
                required: true
              })
            ),
            h(
              "label",
              { className: "field" },
              h("span", { className: "field-label" }, "한줄 추천 이유"),
              h("textarea", {
                value: directForm.reason,
                onInput: (event) =>
                  setDirectForm((current) => ({
                    ...current,
                    reason: event.target.value
                  })),
                placeholder: "이 장소를 왜 넣고 싶은지 짧게 적어주세요",
                rows: 4,
                required: true
              })
            ),
            h(SubmitButton, {
              disabled:
                !directForm.name.trim() ||
                !directForm.address.trim() ||
                !directForm.reason.trim() ||
                isSubmitting,
              isLoading: isSubmitting,
              label: isSubmitting ? "저장 중..." : "등록하기"
            })
          )
    )
  );
}
