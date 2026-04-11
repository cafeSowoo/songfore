import { CloseIcon } from "./Icons.js";

const { createElement: h, useState } = window.React;

const initialForm = {
  category: "cafe",
  reason: "",
  address: "",
  friendName: "",
  description: ""
};

export function AddPlaceSheet({ categories, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);

  function handleChange(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return h(
    "div",
    { className: "sheet-overlay warm", onClick: onClose },
    h(
      "section",
      {
        className: "add-sheet add-sheet-simple",
        onClick: (event) => event.stopPropagation()
      },
      h(
        "div",
        { className: "add-sheet-head add-sheet-head-simple" },
        h("h2", null, "새로운 장소 추가"),
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
        "form",
        { className: "add-form add-form-simple", onSubmit: handleSubmit },
        h(
          "div",
          { className: "field" },
          h("span", { className: "field-label" }, "카테고리"),
          h(
            "div",
            { className: "category-chip-row" },
            ...categories.map((category) =>
              h(
                "button",
                {
                  key: category.id,
                  type: "button",
                  className: `category-select-chip ${
                    form.category === category.id ? "active" : ""
                  }`,
                  onClick: () => handleChange("category", category.id)
                },
                category.label
              )
            )
          )
        ),
        h(
          "label",
          { className: "field" },
          h("span", { className: "field-label" }, "주소 또는 지역"),
          h("input", {
            value: form.address,
            onInput: (event) => handleChange("address", event.target.value),
            placeholder: "대전광역시 서구...",
            required: true
          })
        ),
        h(
          "label",
          { className: "field" },
          h("span", { className: "field-label" }, "한줄 추천 이유"),
          h("textarea", {
            value: form.reason,
            onInput: (event) => handleChange("reason", event.target.value),
            placeholder: "이 장소를 추천하는 특별한 이유를 공유해주세요",
            rows: 4,
            required: true
          })
        ),
        h("button", { type: "submit", className: "submit-button" }, "등록하기")
      )
    )
  );
}
