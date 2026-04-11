import { CalendarIcon, CompassIcon, PlusIcon, SparkleIcon } from "./Icons.js";

const { createElement: h } = window.React;

export function BottomNav({ activeTab, onChange, onOpenAdd }) {
  return h(
    "div",
    { className: "bottom-nav-shell" },
    h(
      "button",
      {
        type: "button",
        className: "bottom-nav-fab",
        onClick: onOpenAdd,
        "aria-label": "새로 추가"
      },
      h(PlusIcon, { className: "bottom-nav-fab-icon" })
    ),
    h(
      "nav",
      { className: "bottom-nav", "aria-label": "하단 탐색" },
      h(
        "button",
        {
          type: "button",
          className: `bottom-nav-item ${activeTab === "feed" ? "active" : ""}`,
          onClick: () => onChange("feed")
        },
        h(
          "span",
          { className: "bottom-nav-icon-shell" },
          h(SparkleIcon, { className: "bottom-nav-icon" })
        ),
        h("span", { className: "bottom-nav-label" }, "피드")
      ),
      h(
        "button",
        {
          type: "button",
          className: `bottom-nav-item ${activeTab === "map" ? "active" : ""}`,
          onClick: () => onChange("map")
        },
        h(
          "span",
          { className: "bottom-nav-icon-shell" },
          h(CompassIcon, { className: "bottom-nav-icon" })
        ),
        h("span", { className: "bottom-nav-label" }, "지도")
      ),
      h(
        "button",
        {
          type: "button",
          className: `bottom-nav-item ${activeTab === "schedule" ? "active" : ""}`,
          onClick: () => onChange("schedule")
        },
        h(
          "span",
          { className: "bottom-nav-icon-shell" },
          h(CalendarIcon, { className: "bottom-nav-icon" })
        ),
        h("span", { className: "bottom-nav-label" }, "일정")
      )
    )
  );
}
