const { createElement: h, useEffect, useRef, useState } = window.React;

export function NicknamePrompt({ initialValue = "", onCancel, onSubmit }) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const normalized = String(value || "").trim();

    if (!normalized) {
      return;
    }

    onSubmit(normalized);
  }

  return h(
    "div",
    {
      className: "sheet-overlay warm nickname-overlay",
      onClick: onCancel
    },
    h(
      "section",
      {
        className: "nickname-modal",
        onClick: (event) => event.stopPropagation()
      },
      h("span", { className: "eyebrow subtle" }, "닉네임 입력"),
      h("h3", null, "친구들이 알아볼 수 있게 이름을 적어주세요."),
      h(
        "p",
        { className: "nickname-subcopy" },
        "장소 추천과 한마디에 이 이름으로 표시돼요."
      ),
      h(
        "form",
        { className: "nickname-form", onSubmit: handleSubmit },
        h("input", {
          ref: inputRef,
          value,
          onInput: (event) => setValue(event.target.value),
          placeholder: "예: 지원, 민호, js",
          maxLength: 20,
          "aria-label": "닉네임"
        }),
        h(
          "div",
          { className: "nickname-actions" },
          h(
            "button",
            {
              type: "button",
              className: "ghost-button nickname-cancel",
              onClick: onCancel
            },
            "취소"
          ),
          h(
            "button",
            {
              type: "submit",
              className: "submit-button nickname-submit"
            },
            "확인"
          )
        )
      )
    )
  );
}
