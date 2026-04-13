import {
  categoryOptions,
  createComment,
  createPlace,
  createPlaceRecord,
  fetchTripSnapshot,
  friendRoster,
  getRuntimeConfig,
  getVisiblePlaces
} from "./lib/api.js";
import { seedPlaces, tripMeta } from "./data/sampleTrip.js";
import { AddPlaceSheet } from "./components/AddPlaceSheet.js";
import { AppHeader } from "./components/AppHeader.js";
import { BottomNav } from "./components/BottomNav.js";
import { DiscoveryMap } from "./components/DiscoveryMap.js";
import { FilterChips } from "./components/FilterChips.js";
import { PlaceCard } from "./components/PlaceCard.js";
import { PlaceDetailSheet } from "./components/PlaceDetailSheet.js";
import { ScheduleTimeline } from "./components/ScheduleTimeline.js";

const { createElement: h, useEffect, useState } = window.React;

const runtimeConfig = getRuntimeConfig(tripMeta);

const defaultTimelineSlots = [
  { dayId: "day-1", time: "09:00" },
  { dayId: "day-1", time: "11:30" },
  { dayId: "day-1", time: "15:00" },
  { dayId: "day-1", time: "18:30" },
  { dayId: "day-2", time: "10:00" },
  { dayId: "day-2", time: "14:00" },
  { dayId: "day-2", time: "19:00" }
];

const initialScheduleEntries = buildSuggestedScheduleEntries(seedPlaces);

function createScheduleId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildSuggestedScheduleEntries(places) {
  return defaultTimelineSlots
    .slice(0, Math.min(defaultTimelineSlots.length, places.length))
    .map((slot, index) => ({
      id: `schedule-seed-${index + 1}`,
      dayId: slot.dayId,
      time: slot.time,
      type: "place",
      placeId: places[index].id
    }));
}

function syncScheduleEntries(currentEntries, places) {
  const validPlaceIds = new Set(places.map((place) => place.id));
  const keptEntries = currentEntries.filter(
    (entry) => entry.type !== "place" || validPlaceIds.has(entry.placeId)
  );

  if (places.length === 0) {
    return keptEntries.filter((entry) => entry.type === "note");
  }

  const hasAnyPlaceEntry = keptEntries.some((entry) => entry.type === "place");
  const hasAnyNoteEntry = keptEntries.some((entry) => entry.type === "note");

  if (hasAnyPlaceEntry || hasAnyNoteEntry) {
    return keptEntries;
  }

  return buildSuggestedScheduleEntries(places);
}

function getPlaceScheduleBadge(entries, placeId) {
  const matchedEntries = entries
    .filter((entry) => entry.type === "place" && entry.placeId === placeId)
    .sort((left, right) => {
      const dayCompare = String(left.dayId).localeCompare(String(right.dayId));

      if (dayCompare !== 0) {
        return dayCompare;
      }

      return String(left.time).localeCompare(String(right.time));
    });

  const firstEntry = matchedEntries[0];

  if (!firstEntry) {
    return null;
  }

  return {
    day: `DAY ${String(firstEntry.dayId).replace("day-", "")}`,
    time: firstEntry.time
  };
}

function getStoredNickname() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem("dj-nickname") || "";
}

export function App() {
  const [trip, setTrip] = useState({
    ...tripMeta,
    slug: runtimeConfig.tripSlug || tripMeta.slug,
    title: runtimeConfig.tripTitle || tripMeta.title,
    description: runtimeConfig.tripDescription || tripMeta.description
  });
  const [places, setPlaces] = useState(seedPlaces);
  const [scheduleEntries, setScheduleEntries] = useState(initialScheduleEntries);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [focusedMapPlaceId, setFocusedMapPlaceId] = useState(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [nickname, setNickname] = useState(getStoredNickname);
  const [dataMode, setDataMode] = useState("demo");

  const visiblePlaces = getVisiblePlaces(places, activeFilter);
  const selectedPlace = places.find((place) => place.id === selectedPlaceId) || null;
  const hasFocusedPlace = visiblePlaces.some((place) => place.id === focusedMapPlaceId);

  useEffect(() => {
    let cancelled = false;

    async function hydrateRemoteTrip() {
      try {
        const snapshot = await fetchTripSnapshot(runtimeConfig.tripSlug);

        if (cancelled) {
          return;
        }

        applySnapshot(snapshot, {
          syncSchedule: true
        });
        setDataMode("remote");
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.warn("Failed to load /dj trip snapshot. Falling back to demo data.", error);
        setDataMode("demo");
      }
    }

    hydrateRemoteTrip();

    return () => {
      cancelled = true;
    };
  }, []);

  function applySnapshot(snapshot, options = {}) {
    const nextPlaces = Array.isArray(snapshot?.places) ? snapshot.places : [];
    const nextTrip = snapshot?.trip || {};

    setTrip((currentTrip) => ({
      ...currentTrip,
      slug: nextTrip.slug || currentTrip.slug,
      title: nextTrip.title || currentTrip.title,
      description: nextTrip.description || currentTrip.description
    }));

    setPlaces(nextPlaces);

    setSelectedPlaceId((currentSelectedPlaceId) => {
      if (options.selectedPlaceId && nextPlaces.some((place) => place.id === options.selectedPlaceId)) {
        return options.selectedPlaceId;
      }

      if (currentSelectedPlaceId && nextPlaces.some((place) => place.id === currentSelectedPlaceId)) {
        return currentSelectedPlaceId;
      }

      return null;
    });

    setFocusedMapPlaceId((currentFocusedPlaceId) =>
      currentFocusedPlaceId && nextPlaces.some((place) => place.id === currentFocusedPlaceId)
        ? currentFocusedPlaceId
        : null
    );

    if (options.syncSchedule) {
      setScheduleEntries((currentEntries) => syncScheduleEntries(currentEntries, nextPlaces));
    }
  }

  function ensureNickname() {
    const currentNickname = String(nickname || "").trim();

    if (currentNickname) {
      return currentNickname;
    }

    const promptedNickname = window.prompt(
      "친구들이 알아볼 수 있게 닉네임을 입력해 주세요.",
      ""
    );
    const normalizedNickname = String(promptedNickname || "").trim();

    if (!normalizedNickname) {
      return null;
    }

    window.localStorage.setItem("dj-nickname", normalizedNickname);
    setNickname(normalizedNickname);
    return normalizedNickname;
  }

  function handleToggleSave(placeId) {
    setPlaces((currentPlaces) =>
      currentPlaces.map((place) => {
        if (place.id !== placeId) {
          return place;
        }

        const nextSaved = !place.saved;

        return {
          ...place,
          saved: nextSaved,
          saveCount: Math.max(place.baseSaveCount + (nextSaved ? 1 : 0), 0)
        };
      })
    );
  }

  async function handleAddPlaceComment(placeId, text) {
    const normalizedText = String(text || "").trim();

    if (!normalizedText) {
      return;
    }

    const authorNickname = ensureNickname();

    if (!authorNickname) {
      return;
    }

    if (dataMode === "remote") {
      try {
        const snapshot = await createComment({
          slug: trip.slug,
          placeId,
          nickname: authorNickname,
          content: normalizedText
        });

        applySnapshot(snapshot, {
          selectedPlaceId: placeId
        });
        return;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "한마디를 저장하지 못했어요.";
        window.alert(message);
      }
    }

    setPlaces((currentPlaces) =>
      currentPlaces.map((place) => {
        if (place.id !== placeId) {
          return place;
        }

        const nextComments = Array.isArray(place.comments) ? [...place.comments] : [];

        nextComments.push({
          id: `comment-${Date.now()}`,
          name: authorNickname,
          text: normalizedText,
          time: "방금 전",
          accent: nextComments.length % 2 === 0 ? "left" : "right"
        });

        return {
          ...place,
          comments: nextComments
        };
      })
    );
  }

  async function handleAddPlace(formData) {
    const authorNickname = ensureNickname();

    if (!authorNickname) {
      return;
    }

    if (dataMode === "remote") {
      try {
        const snapshot = await createPlace({
          slug: trip.slug,
          category: formData.category,
          name: formData.name,
          address: formData.address,
          reason: formData.reason,
          description: formData.description,
          nickname: authorNickname,
          latitude: formData.latitude,
          longitude: formData.longitude,
          resolvedAddress: formData.resolvedAddress
        });

        const newestPlaceId = snapshot.places[0]?.id || null;

        applySnapshot(snapshot, {
          selectedPlaceId: newestPlaceId,
          syncSchedule: false
        });
        setActiveFilter("all");
        setActiveTab("feed");
        setFocusedMapPlaceId(null);
        setSelectedPlaceId(newestPlaceId);
        setIsAddSheetOpen(false);
        return;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "장소를 추가하지 못했어요.";
        window.alert(message);
      }
    }

    const nextPlace = createPlaceRecord(formData, places.length, authorNickname);

    setPlaces((currentPlaces) => [nextPlace, ...currentPlaces]);
    setActiveFilter("all");
    setActiveTab("feed");
    setFocusedMapPlaceId(null);
    setSelectedPlaceId(nextPlace.id);
    setIsAddSheetOpen(false);
  }

  function handleAddScheduleFromCard(dayId, time, placeId) {
    setScheduleEntries((currentEntries) => [
      ...currentEntries,
      {
        id: createScheduleId("schedule-place"),
        dayId,
        time,
        type: "place",
        placeId
      }
    ]);
  }

  function handleAddScheduleCustom(dayId, time, title) {
    setScheduleEntries((currentEntries) => [
      ...currentEntries,
      {
        id: createScheduleId("schedule-note"),
        dayId,
        time,
        type: "note",
        title: title.trim()
      }
    ]);
  }

  function handleDeleteScheduleEntry(entryId) {
    setScheduleEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== entryId)
    );
  }

  function handleDeletePlace(placeId) {
    if (!window.confirm("삭제하시겠습니까?")) {
      return;
    }

    if (dataMode === "remote") {
      window.alert("장소 삭제는 아직 운영 API와 연결되지 않아 준비 중이에요.");
      return;
    }

    setPlaces((currentPlaces) => currentPlaces.filter((place) => place.id !== placeId));
    setScheduleEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.placeId !== placeId)
    );

    if (selectedPlaceId === placeId) {
      setSelectedPlaceId(null);
    }

    if (focusedMapPlaceId === placeId) {
      setFocusedMapPlaceId(null);
    }
  }

  function handleOpenPlace(placeId) {
    setSelectedPlaceId(placeId);
  }

  function handleCloseDetail() {
    setSelectedPlaceId(null);
  }

  function handleOpenAddSheet() {
    setIsAddSheetOpen(true);
  }

  function handleCloseAddSheet() {
    setIsAddSheetOpen(false);
  }

  function handleShowMapFromDetail() {
    setActiveTab("map");
    setFocusedMapPlaceId(selectedPlaceId);
    setSelectedPlaceId(null);
  }

  function handleChangeFilter(nextFilter) {
    setActiveFilter(nextFilter);
    setFocusedMapPlaceId(null);
  }

  function handleChangeTab(nextTab) {
    setActiveTab(nextTab);

    if (nextTab !== "map") {
      setFocusedMapPlaceId(null);
    }
  }

  function handleFocusMapPlace(placeId) {
    setFocusedMapPlaceId(placeId);
  }

  function handleClearMapFocus() {
    setFocusedMapPlaceId(null);
  }

  return h(
    "div",
    { className: "app-shell" },
    h("div", { className: "ambient ambient-one" }),
    h("div", { className: "ambient ambient-two" }),
    h(
      "div",
      { className: "phone-stage" },
      h(
        "div",
        { className: "phone-frame" },
        h(AppHeader, { meta: trip }),
        h(
          "main",
          { className: "app-content" },
          activeTab !== "schedule"
            ? h(FilterChips, {
                categories: categoryOptions,
                activeFilter,
                onChange: handleChangeFilter
              })
            : null,
          activeTab === "feed"
            ? h(
                "section",
                { className: "feed-section" },
                visiblePlaces.length
                  ? h(
                      "div",
                      { className: "place-list" },
                      ...visiblePlaces.map((place) =>
                        h(PlaceCard, {
                          key: place.id,
                          place,
                          scheduleBadge: getPlaceScheduleBadge(scheduleEntries, place.id),
                          onOpen: handleOpenPlace,
                          onToggleSave: handleToggleSave
                        })
                      )
                    )
                  : h(
                      "div",
                      { className: "empty-state" },
                      h("strong", null, "아직 이 카테고리에는 장소가 없어요."),
                      h(
                        "p",
                        null,
                        "필터를 바꾸거나 오른쪽 아래 플러스 버튼으로 다음 후보를 바로 모아보세요."
                      )
                    )
              )
            : activeTab === "map"
              ? h(DiscoveryMap, {
                  places: visiblePlaces.length ? visiblePlaces : places,
                  activeFilter,
                  focusedPlaceId: hasFocusedPlace ? focusedMapPlaceId : null,
                  onFocusPlace: handleFocusMapPlace,
                  onClearFocus: handleClearMapFocus,
                  onOpenPlace: handleOpenPlace
                })
              : activeTab === "schedule"
                ? h(ScheduleTimeline, {
                    places,
                    entries: scheduleEntries,
                    onAddFromCard: handleAddScheduleFromCard,
                    onAddDirect: handleAddScheduleCustom,
                    onDeleteEntry: handleDeleteScheduleEntry,
                    onOpenPlace: handleOpenPlace
                  })
                : h(
                    "section",
                    { className: "feed-section" },
                    h(
                      "div",
                      { className: "empty-state" },
                      h("strong", null, "잡담 메뉴는 다음 단계에서 붙일게요."),
                      h(
                        "p",
                        null,
                        "친구들이 일정이나 장소에 대해 편하게 이야기하는 공간은 여기로 연결할 예정입니다."
                      )
                    )
                  )
        ),
        h(BottomNav, {
          activeTab,
          onChange: handleChangeTab,
          onOpenAdd: handleOpenAddSheet
        })
      )
    ),
    selectedPlace
      ? h(PlaceDetailSheet, {
          place: selectedPlace,
          onDeletePlace: handleDeletePlace,
          onClose: handleCloseDetail,
          onAddComment: handleAddPlaceComment,
          onToggleSave: handleToggleSave,
          onShowMap: handleShowMapFromDetail
        })
      : null,
    isAddSheetOpen
      ? h(AddPlaceSheet, {
          friends: friendRoster,
          categories: categoryOptions.filter((category) => category.id !== "all"),
          mapsClientId: runtimeConfig.naverMapsClientId,
          onClose: handleCloseAddSheet,
          onSubmit: handleAddPlace
        })
      : null
  );
}
