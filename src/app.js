import {
  categoryOptions,
  createPlaceRecord,
  friendRoster,
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

const { createElement: h, useState } = window.React;

const initialScheduleEntries = [
  { id: "schedule-1", dayId: "day-1", time: "09:00", type: "place", placeId: "sungsimdang" },
  { id: "schedule-2", dayId: "day-1", time: "11:30", type: "place", placeId: "hanbat-arboretum" },
  {
    id: "schedule-3",
    dayId: "day-1",
    time: "15:00",
    type: "place",
    placeId: "shinsegae-art-science"
  },
  { id: "schedule-4", dayId: "day-1", time: "18:30", type: "place", placeId: "soje-dong" },
  { id: "schedule-5", dayId: "day-2", time: "10:00", type: "place", placeId: "oc-kalguksu" },
  { id: "schedule-6", dayId: "day-2", time: "14:00", type: "place", placeId: "daeheung-winebar" },
  { id: "schedule-7", dayId: "day-2", time: "19:00", type: "place", placeId: "dadong-sky-park" }
];

function createScheduleId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function App() {
  const [places, setPlaces] = useState(seedPlaces);
  const [scheduleEntries, setScheduleEntries] = useState(initialScheduleEntries);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [focusedMapPlaceId, setFocusedMapPlaceId] = useState(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const visiblePlaces = getVisiblePlaces(places, activeFilter);
  const selectedPlace =
    places.find((place) => place.id === selectedPlaceId) || null;
  const hasFocusedPlace = visiblePlaces.some((place) => place.id === focusedMapPlaceId);

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

  function handleAddPlace(formData) {
    const nextPlace = createPlaceRecord(formData, places.length);

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
        h(AppHeader, { meta: tripMeta }),
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
                          onOpen: handleOpenPlace,
                          onToggleSave: handleToggleSave
                        })
                      )
                    )
                  : h(
                      "div",
                      { className: "empty-state" },
                      h("strong", null, "아직 이 카테고리에는 장소가 없어요."),
                      h("p", null, "필터를 바꾸거나 플러스 버튼으로 다음 후보를 바로 모아보세요.")
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
              : h(ScheduleTimeline, {
                  places,
                  entries: scheduleEntries,
                  onAddFromCard: handleAddScheduleFromCard,
                  onAddDirect: handleAddScheduleCustom,
                  onDeleteEntry: handleDeleteScheduleEntry
                })
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
          onClose: handleCloseDetail,
          onToggleSave: handleToggleSave,
          onShowMap: handleShowMapFromDetail
        })
      : null,
    isAddSheetOpen
      ? h(AddPlaceSheet, {
          friends: friendRoster,
          categories: categoryOptions.filter((category) => category.id !== "all"),
          onClose: handleCloseAddSheet,
          onSubmit: handleAddPlace
        })
      : null
  );
}
