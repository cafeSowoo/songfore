import { createComment, createPlace, fetchTripSnapshot } from "../lib/api.js";

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function normalizePlaceCoordinates(places) {
  if (places.length === 0) {
    return [];
  }

  const latitudes = places.map((place) => Number(place.latitude));
  const longitudes = places.map((place) => Number(place.longitude));
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return places.map((place) => {
    const x =
      maxLng === minLng
        ? 50
        : 12 + ((Number(place.longitude) - minLng) / (maxLng - minLng)) * 76;
    const y =
      maxLat === minLat
        ? 50
        : 86 - ((Number(place.latitude) - minLat) / (maxLat - minLat)) * 72;

    return {
      ...place,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      mapX: Number(x.toFixed(2)),
      mapY: Number(y.toFixed(2))
    };
  });
}

export function createStore(seedData, runtimeConfig) {
  const listeners = new Set();
  const persistedNickname = window.localStorage.getItem("dj-nickname") || "";
  const initialTrip = {
    slug: runtimeConfig.tripSlug || seedData.trip.slug,
    title: runtimeConfig.tripTitle || seedData.trip.title,
    description: runtimeConfig.tripDescription || seedData.trip.description
  };

  let state = {
    trip: initialTrip,
    categories: seedData.categories,
    places: [],
    selectedCategory: "all",
    selectedPlaceId: null,
    isAddFormOpen: false,
    nickname: persistedNickname,
    accessGranted: Boolean(persistedNickname),
    uiNotice: runtimeConfig.naverMapsClientId
      ? "네이버 지도 키가 연결되어 있습니다. 실제 마커를 불러옵니다."
      : "네이버 지도 키가 없어 프리뷰 지도로 표시됩니다.",
    isInitializing: true,
    isSavingPlace: false,
    isSavingComment: false,
    dataMode: "remote",
    errorMessage: ""
  };

  const notify = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const setState = (updater) => {
    state = typeof updater === "function" ? updater(state) : { ...state, ...updater };
    notify();
  };

  const getFilteredPlaces = () =>
    state.selectedCategory === "all"
      ? state.places
      : state.places.filter((place) => place.category === state.selectedCategory);

  const applySnapshot = (snapshot, mode = "remote") => {
    setState((current) => {
      const normalizedPlaces = normalizePlaceCoordinates(snapshot.places || []);
      const filteredPlaces =
        current.selectedCategory === "all"
          ? normalizedPlaces
          : normalizedPlaces.filter(
              (place) => place.category === current.selectedCategory
            );
      const nextSelectedPlaceId = filteredPlaces.some(
        (place) => place.id === current.selectedPlaceId
      )
        ? current.selectedPlaceId
        : filteredPlaces[0]?.id ?? null;

      return {
        ...current,
        trip: snapshot.trip,
        places: normalizedPlaces,
        selectedPlaceId: nextSelectedPlaceId,
        dataMode: mode,
        isInitializing: false,
        errorMessage:
          mode === "demo" ? "백엔드 연결이 실패해 예시 데이터로 표시 중입니다." : ""
      };
    });
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return {
        ...state,
        filteredPlaces: getFilteredPlaces(),
        runtimeConfig
      };
    },
    async initialize() {
      try {
        const snapshot = await fetchTripSnapshot(state.trip.slug);
        applySnapshot(snapshot, "remote");
      } catch {
        applySnapshot(
          {
            trip: initialTrip,
            places: seedData.places
          },
          "demo"
        );
      }
    },
    setCategory(categoryId) {
      setState((current) => {
        const filtered =
          categoryId === "all"
            ? current.places
            : current.places.filter((place) => place.category === categoryId);

        return {
          ...current,
          selectedCategory: categoryId,
          selectedPlaceId: filtered[0]?.id ?? null
        };
      });
    },
    selectPlace(placeId) {
      setState((current) => ({
        ...current,
        selectedPlaceId: placeId
      }));
    },
    openAddForm() {
      setState((current) => ({
        ...current,
        isAddFormOpen: true
      }));
    },
    closeAddForm() {
      setState((current) => ({
        ...current,
        isAddFormOpen: false
      }));
    },
    toggleAddForm() {
      setState((current) => ({
        ...current,
        isAddFormOpen: !current.isAddFormOpen
      }));
    },
    async addPlace(formData) {
      if (!state.nickname) {
        window.alert("먼저 닉네임을 입력해 주세요.");
        return;
      }

      setState((current) => ({
        ...current,
        isSavingPlace: true,
        errorMessage: ""
      }));

      try {
        const snapshot = await createPlace({
          slug: state.trip.slug,
          category: formData.category,
          name: formData.name.trim(),
          address: formData.address.trim(),
          description: formData.description.trim(),
          nickname: state.nickname,
          latitude: formData.latitude,
          longitude: formData.longitude,
          resolvedAddress: formData.resolvedAddress
        });

        applySnapshot(snapshot, "remote");
        setState((current) => ({
          ...current,
          isSavingPlace: false,
          isAddFormOpen: false
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "장소를 저장하지 못했습니다.";

        setState((current) => ({
          ...current,
          isSavingPlace: false,
          errorMessage: message
        }));
        window.alert(message);
      }
    },
    async addComment(placeId, content) {
      if (!content.trim()) {
        return;
      }

      if (!state.nickname) {
        window.alert("먼저 닉네임을 입력해 주세요.");
        return;
      }

      setState((current) => ({
        ...current,
        isSavingComment: true,
        errorMessage: ""
      }));

      try {
        const snapshot = await createComment({
          slug: state.trip.slug,
          placeId,
          content: content.trim(),
          nickname: state.nickname
        });

        applySnapshot(snapshot, "remote");
        setState((current) => ({
          ...current,
          isSavingComment: false
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "댓글을 저장하지 못했습니다.";

        setState((current) => ({
          ...current,
          isSavingComment: false,
          errorMessage: message
        }));
        window.alert(message);
      }
    },
    unlockAccess({ nickname }) {
      const trimmedNickname = nickname.trim() || `멤버-${createId("guest").slice(-4)}`;

      window.localStorage.setItem("dj-nickname", trimmedNickname);

      setState((current) => ({
        ...current,
        nickname: trimmedNickname,
        accessGranted: true
      }));
    },
    copyShareUrl() {
      const url = `${window.location.origin}/${state.trip.slug}`;
      navigator.clipboard
        .writeText(url)
        .then(() => window.alert("공유용 URL을 복사했습니다."))
        .catch(() => window.prompt("아래 URL을 복사해 주세요.", url));
    }
  };
}
