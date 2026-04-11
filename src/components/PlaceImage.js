import { CameraIcon } from "./Icons.js";

const { createElement: h, useState } = window.React;

export function PlaceImage({
  src,
  alt,
  className = "place-image-frame",
  overlay = null
}) {
  const [hasError, setHasError] = useState(false);
  const showPlaceholder = !src || hasError;

  return h(
    "div",
    { className },
    showPlaceholder
      ? h(
          "div",
          { className: "image-placeholder" },
          h(CameraIcon, { className: "placeholder-icon" }),
          h("strong", null, alt),
          h("span", null, "이미지가 없어도 어색하지 않게 카드가 정리되도록 디자인했어요.")
        )
      : h("img", {
          src,
          alt,
          className: "place-image",
          loading: "lazy",
          onError: () => setHasError(true)
        }),
    overlay
      ? h("div", { className: "place-image-overlay" }, overlay)
      : null
  );
}
