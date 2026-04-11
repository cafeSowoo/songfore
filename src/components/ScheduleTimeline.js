import { categoryOptions, getCategoryById } from "../lib/api.js";
import { TrashIcon } from "./Icons.js";

const { createElement: h, useEffect, useMemo, useState } = window.React;

const meridiemOptions = ["오전", "오후"];
const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const minuteOptions = ["00", "30"];

function toTimeString(period, hour, minute) {
  let numericHour = Number(hour);

  if (period === "오전") {
    numericHour = numericHour === 12 ? 0 : numericHour;
  } else {
    numericHour = numericHour === 12 ? 12 : numericHour + 12;
  }

  return `${String(numericHour).padStart(2, "0")}:${minute}`;
}

function toTimeParts(value) {
  const [hourString = "09", minute = "00"] = String(value || "09:00").split(":");
  const numericHour = Number(hourString);
  const period = numericHour >= 12 ? "오후" : "오전";
  const normalizedHour = numericHour % 12 === 0 ? 12 : numericHour % 12;

  return {
    period,
    hour: String(normalizedHour).padStart(2, "0"),
    minute
  };
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => left.time.localeCompare(right.time));
}

function buildDayTabs(entries) {
  const dayIds = [...new Set(entries.map((entry) => entry.dayId))];

  return dayIds.map((dayId, index) => ({
    id: dayId,
    dayLabel: `DAY ${index + 1}`
  }));
}

export function ScheduleTimeline({
  places,
  entries,
  onAddFromCard,
  onAddDirect,
  onDeleteEntry
}) {
  const dayTabs = useMemo(() => buildDayTabs(entries), [entries]);
  const initialPlaceTime = toTimeParts("09:00");
  const initialDirectTime = toTimeParts("09:00");

  const [activeDayId, setActiveDayId] = useState(dayTabs[0]?.id || "day-1");
  const [menuMode, setMenuMode] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [placePeriod, setPlacePeriod] = useState(initialPlaceTime.period);
  const [placeHour, setPlaceHour] = useState(initialPlaceTime.hour);
  const [placeMinute, setPlaceMinute] = useState(initialPlaceTime.minute);
  const [selectedPlaceId, setSelectedPlaceId] = useState(places[0]?.id || "");
  const [directPeriod, setDirectPeriod] = useState(initialDirectTime.period);
  const [directHour, setDirectHour] = useState(initialDirectTime.hour);
  const [directMinute, setDirectMinute] = useState(initialDirectTime.minute);
  const [directTitle, setDirectTitle] = useState("");

  useEffect(() => {
    if (!dayTabs.some((day) => day.id === activeDayId)) {
      setActiveDayId(dayTabs[0]?.id || "day-1");
    }
  }, [activeDayId, dayTabs]);

  useEffect(() => {
    if (!places.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(places[0]?.id || "");
    }
  }, [places, selectedPlaceId]);

  const categoryFilterOptions = categoryOptions.filter((category) => category.id !== "all");
  const filteredPlaces =
    selectedCategory === "all"
      ? places
      : places.filter((place) => place.category === selectedCategory);
  const activeEntries = sortEntries(entries.filter((entry) => entry.dayId === activeDayId));

  useEffect(() => {
    if (!filteredPlaces.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(filteredPlaces[0]?.id || "");
    }
  }, [filteredPlaces, selectedPlaceId]);

  function closeMenu() {
    setMenuMode("");
    setSelectedCategory("all");
  }

  function handleSaveFromCard(event) {
    event.preventDefault();

    if (!selectedPlaceId) {
      return;
    }

    onAddFromCard(activeDayId, toTimeString(placePeriod, placeHour, placeMinute), selectedPlaceId);
    setPlacePeriod(initialPlaceTime.period);
    setPlaceHour(initialPlaceTime.hour);
    setPlaceMinute(initialPlaceTime.minute);
    closeMenu();
  }

  function handleSaveDirect(event) {
    event.preventDefault();

    if (!directTitle.trim()) {
      return;
    }

    onAddDirect(activeDayId, toTimeString(directPeriod, directHour, directMinute), directTitle);
    setDirectPeriod(initialDirectTime.period);
    setDirectHour(initialDirectTime.hour);
    setDirectMinute(initialDirectTime.minute);
    setDirectTitle("");
    closeMenu();
  }

  function handleDelete(entryId) {
    if (window.confirm("삭제하시겠습니까?")) {
      onDeleteEntry(entryId);
    }
  }

  function renderTimePicker(period, hour, minute, onPeriod, onHour, onMinute) {
    return h(
      "div",
      { className: "schedule-time-picker" },
      h(
        "select",
        { value: period, onChange: (event) => onPeriod(event.target.value) },
        ...meridiemOptions.map((option) => h("option", { key: option, value: option }, option))
      ),
      h(
        "select",
        { value: hour, onChange: (event) => onHour(event.target.value) },
        ...hourOptions.map((option) => h("option", { key: option, value: option }, option))
      ),
      h(
        "select",
        { value: minute, onChange: (event) => onMinute(event.target.value) },
        ...minuteOptions.map((option) => h("option", { key: option, value: option }, option))
      )
    );
  }

  return h(
    "section",
    { className: "schedule-section" },
    h(
      "div",
      { className: "schedule-topbar" },
      h(
        "div",
        { className: "schedule-day-switcher" },
        ...dayTabs.map((day) =>
          h(
            "button",
            {
              key: day.id,
              type: "button",
              className: `schedule-day-tab ${activeDayId === day.id ? "active" : ""}`,
              onClick: () => setActiveDayId(day.id)
            },
            day.dayLabel
          )
        )
      ),
      h(
        "div",
        { className: "schedule-add-wrap" },
        h(
          "button",
          {
            type: "button",
            className: "schedule-add-button",
            onClick: () => setMenuMode((current) => (current ? "" : "menu"))
          },
          "일정 추가"
        ),
        menuMode === "menu"
          ? h(
              "div",
              { className: "schedule-add-menu" },
              h(
                "button",
                {
                  type: "button",
                  className: "schedule-add-option",
                  onClick: () => setMenuMode("card")
                },
                "카드에서 추가"
              ),
              h(
                "button",
                {
                  type: "button",
                  className: "schedule-add-option",
                  onClick: () => setMenuMode("direct")
                },
                "직접 입력"
              )
            )
          : null
      )
    ),
    menuMode === "card"
      ? h(
          "form",
          { className: "schedule-add-panel", onSubmit: handleSaveFromCard },
          h(
            "label",
            { className: "schedule-add-field" },
            h("span", null, "시간 지정"),
            renderTimePicker(
              placePeriod,
              placeHour,
              placeMinute,
              setPlacePeriod,
              setPlaceHour,
              setPlaceMinute
            )
          ),
          h(
            "label",
            { className: "schedule-add-field" },
            h("span", null, "카테고리"),
            h(
              "select",
              {
                value: selectedCategory,
                onChange: (event) => setSelectedCategory(event.target.value)
              },
              h("option", { value: "all" }, "전체"),
              ...categoryFilterOptions.map((category) =>
                h("option", { key: category.id, value: category.id }, category.label)
              )
            )
          ),
          h(
            "div",
            { className: "schedule-add-field" },
            h("span", null, "카드에서 추가"),
            h(
              "div",
              { className: "schedule-place-list" },
              ...filteredPlaces.map((place) =>
                h(
                  "button",
                  {
                    key: place.id,
                    type: "button",
                    className: `schedule-place-option ${
                      selectedPlaceId === place.id ? "active" : ""
                    }`,
                    onClick: () => setSelectedPlaceId(place.id)
                  },
                  place.name
                )
              )
            )
          ),
          h(
            "div",
            { className: "schedule-add-actions" },
            h(
              "button",
              {
                type: "button",
                className: "schedule-cancel-button",
                onClick: closeMenu
              },
              "닫기"
            ),
            h("button", { type: "submit", className: "schedule-save-button" }, "입력하기")
          )
        )
      : null,
    menuMode === "direct"
      ? h(
          "form",
          { className: "schedule-add-panel", onSubmit: handleSaveDirect },
          h(
            "label",
            { className: "schedule-add-field" },
            h("span", null, "시간 지정"),
            renderTimePicker(
              directPeriod,
              directHour,
              directMinute,
              setDirectPeriod,
              setDirectHour,
              setDirectMinute
            )
          ),
          h(
            "label",
            { className: "schedule-add-field" },
            h("span", null, "내용"),
            h("input", {
              value: directTitle,
              onInput: (event) => setDirectTitle(event.target.value),
              placeholder: "예: 체크인 후 카페에서 쉬기",
              required: true
            })
          ),
          h(
            "div",
            { className: "schedule-add-actions" },
            h(
              "button",
              {
                type: "button",
                className: "schedule-cancel-button",
                onClick: closeMenu
              },
              "닫기"
            ),
            h("button", { type: "submit", className: "schedule-save-button" }, "입력하기")
          )
        )
      : null,
    h(
      "article",
      { className: "schedule-day-card" },
      h(
        "div",
        { className: "schedule-timeline" },
        ...activeEntries.map((entry) => {
          const place =
            entry.type === "place" ? places.find((item) => item.id === entry.placeId) : null;
          const category = place ? getCategoryById(place.category) : null;

          return h(
            "div",
            { key: entry.id, className: "schedule-entry" },
            h("div", { className: "schedule-time" }, entry.time),
            h("div", { className: "schedule-line" }),
            h(
              "div",
              {
                className: `schedule-entry-card ${entry.type === "note" ? "schedule-note" : ""}`,
                style: category ? { "--schedule-tone": category.tone } : null
              },
              h(
                "div",
                { className: "schedule-entry-head" },
                h(
                  "div",
                  { className: "schedule-entry-copy" },
                  place
                    ? h("span", { className: "schedule-entry-label" }, category.label)
                    : h("span", { className: "schedule-entry-label" }, "직접 입력"),
                  h("strong", null, place ? place.name : entry.title)
                ),
                h(
                  "button",
                  {
                    type: "button",
                    className: "schedule-delete-button",
                    onClick: (event) => {
                      event.stopPropagation();
                      handleDelete(entry.id);
                    },
                    "aria-label": "일정 삭제"
                  },
                  h(TrashIcon, { className: "schedule-delete-icon" })
                )
              )
            )
          );
        })
      )
    )
  );
}
