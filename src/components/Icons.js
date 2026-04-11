const { createElement: h } = window.React;

function baseIcon(path, className) {
  return h(
    "svg",
    {
      className,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.85",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    ...path
  );
}

export function HeartIcon({ className = "icon", filled = false }) {
  return h(
    "svg",
    {
      className,
      viewBox: "0 0 24 24",
      fill: filled ? "currentColor" : "none",
      stroke: "currentColor",
      strokeWidth: filled ? "1.2" : "1.85",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    h("path", {
      d: "M12 21s-6.716-4.35-9.192-8.272C.784 9.615 2.066 5.5 6.365 5.5c2.13 0 3.303 1.004 4.135 2.132C11.332 6.504 12.505 5.5 14.635 5.5c4.299 0 5.58 4.115 3.557 7.228C18.716 16.65 12 21 12 21Z"
    })
  );
}

export function MapPinIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", {
        key: "pin-1",
        d: "M12 21s6-5.26 6-11a6 6 0 1 0-12 0c0 5.74 6 11 6 11Z"
      }),
      h("circle", { key: "pin-2", cx: "12", cy: "10", r: "2.4" })
    ],
    className
  );
}

export function PlusIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", { key: "plus-1", d: "M12 5v14" }),
      h("path", { key: "plus-2", d: "M5 12h14" })
    ],
    className
  );
}

export function CompassIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("circle", { key: "compass-1", cx: "12", cy: "12", r: "9" }),
      h("path", { key: "compass-2", d: "m14.8 9.2-1.9 5.6-5.7 1.9 1.9-5.7 5.7-1.8Z" })
    ],
    className
  );
}

export function SparkleIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", { key: "sparkle-1", d: "m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" }),
      h("path", { key: "sparkle-2", d: "M19 15.5 20 18l2.5 1-2.5 1-1 2.5-1-2.5L15.5 19l2.5-1 1-2.5Z" }),
      h("path", { key: "sparkle-3", d: "M5 15.5 5.8 17.6 8 18.5l-2.2.9L5 21.5l-.8-2.1L2 18.5l2.2-.9L5 15.5Z" })
    ],
    className
  );
}

export function BookmarkIcon({ className = "icon", filled = false }) {
  return h(
    "svg",
    {
      className,
      viewBox: "0 0 24 24",
      fill: filled ? "currentColor" : "none",
      stroke: "currentColor",
      strokeWidth: filled ? "1.2" : "1.85",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    h("path", {
      d: "M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1Z"
    })
  );
}

export function CloseIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", { key: "close-1", d: "M6 6l12 12" }),
      h("path", { key: "close-2", d: "M18 6 6 18" })
    ],
    className
  );
}

export function ArrowLeftIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", { key: "arrow-left-1", d: "M19 12H7" }),
      h("path", { key: "arrow-left-2", d: "m12 17-5-5 5-5" })
    ],
    className
  );
}

export function PeopleIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", { key: "people-1", d: "M16.5 19v-1a3.5 3.5 0 0 0-3.5-3.5H8A3.5 3.5 0 0 0 4.5 18v1" }),
      h("circle", { key: "people-2", cx: "10.5", cy: "8", r: "3" }),
      h("path", { key: "people-3", d: "M19.5 19v-1.3a3 3 0 0 0-2.4-2.94" }),
      h("path", { key: "people-4", d: "M15.8 5.2a3 3 0 0 1 0 5.6" })
    ],
    className
  );
}

export function CameraIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", { key: "camera-1", d: "M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-1.6A1.5 1.5 0 0 1 9.9 4.8h4.2a1.5 1.5 0 0 1 1.2.6L16.5 7h2A1.5 1.5 0 0 1 20 8.5v8A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-8Z" }),
      h("circle", { key: "camera-2", cx: "12", cy: "12.2", r: "3.3" })
    ],
    className
  );
}

export function CalendarIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", {
        key: "calendar-1",
        d: "M7 4.5v3M17 4.5v3M4.5 9.5h15"
      }),
      h("rect", {
        key: "calendar-2",
        x: "4.5",
        y: "6.5",
        width: "15",
        height: "13",
        rx: "2.5"
      }),
      h("path", {
        key: "calendar-3",
        d: "M9 13h2M13 13h2M9 16.5h2M13 16.5h2"
      })
    ],
    className
  );
}

export function TrashIcon({ className = "icon" }) {
  return baseIcon(
    [
      h("path", { key: "trash-1", d: "M4.5 7.5h15" }),
      h("path", { key: "trash-2", d: "M9.5 4.5h5" }),
      h("path", { key: "trash-3", d: "M7.5 7.5l.7 10a2 2 0 0 0 2 1.8h3.6a2 2 0 0 0 2-1.8l.7-10" }),
      h("path", { key: "trash-4", d: "M10 10.5v5.5M14 10.5v5.5" })
    ],
    className
  );
}
