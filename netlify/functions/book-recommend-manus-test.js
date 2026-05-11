const ALLOWED_ORIGINS = new Set([
  "https://songfore.com",
  "https://www.songfore.com",
  "http://127.0.0.1:4173",
  "http://localhost:8888",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const MANUS_API_BASE = "https://api.manus.ai/v2";
const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 40;
const DEFAULT_TIMEOUT_MS = 100_000;
const MIN_TIMEOUT_MS = 10_000;
const MAX_TIMEOUT_MS = 100_000;

function normalizeTimeoutMs(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, parsed));
}

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRecommendationPrompt({ title, author, quote, description }) {
  const lines = [
    `제목: ${title}`,
    `저자: ${author}`,
  ];

  if (quote) {
    lines.push(`사용자 인용문: '${quote}'`);
  }

  lines.push(`도서 소개:\n${description}`);

  return `아래 자료들을 바탕으로 독서모임 공지용 추천 본문을 작성해줘.

자료:
"""
${lines.join("\n\n")}
"""

조건:
- 정확히 3문장으로 작성
- 첫 문장은 "'${title}'은/는 ..." 형식으로 시작할 것
- 전체는 300자 안팎으로 작성
- 제목과 저자에 직접 관련된 내용만 사용할 것
- 광고 문구처럼 과장하지 말 것
- 쉼표(,)와 접속어(~하며, ~하고, ~속에서)를 남발하지 말고 자연스럽게 작성
- 자연스럽게 마무리될 것 (중간에 끊기는 느낌 금지)
- 줄바꿈 없이 한 문단으로 작성
- 자료의 실제 내용을 바탕으로 쓸 것 (내용 창작 금지)
- 마지막 문장은 "이번 모임에서는"으로 시작해 함께 나눌 대화 주제를 제안할 것
- 따뜻하고 차분한 독서모임 톤
- 앞뒤 인사말·설명·따옴표 없이 본문만 출력`;
}

function findLatestStatus(messages) {
  return [...messages]
    .reverse()
    .find((message) => message?.type === "status_update")?.status_update || null;
}

function findStructuredResult(messages) {
  return [...messages]
    .reverse()
    .find((message) => message?.type === "structured_output_result")
    ?.structured_output_result || null;
}

function findAssistantText(messages) {
  return [...messages]
    .reverse()
    .find((message) => {
      const content = message?.assistant_message?.content;
      return message?.type === "assistant_message" && typeof content === "string" && content.trim();
    })?.assistant_message?.content?.trim() || "";
}

function findErrorText(messages) {
  return [...messages]
    .reverse()
    .find((message) => message?.type === "error_message")
    ?.error_message?.content || "";
}

async function fetchManus(path, apiKey, options = {}) {
  const response = await fetch(`${MANUS_API_BASE}${path}`, {
    ...options,
    signal: AbortSignal.timeout(15_000),
    headers: {
      "Content-Type": "application/json",
      "x-manus-api-key": apiKey,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.ok === false) {
    const message = data?.error?.message || data?.error || `Manus API error (${response.status})`;
    throw new Error(message);
  }

  return data;
}

async function createManusTask(apiKey, prompt) {
  return fetchManus("/task.create", apiKey, {
    method: "POST",
    body: JSON.stringify({
      message: {
        content: [{ type: "text", text: prompt }],
      },
      locale: "ko",
      interactive_mode: false,
      hide_in_task_list: true,
      share_visibility: "private",
      agent_profile: "manus-1.6-lite",
      title: "송도 독서 포레스트 추천글 테스트",
      structured_output_schema: {
        type: "object",
        properties: {
          recommendation: {
            type: "string",
            description: "독서모임 공지에 넣을 3문장 추천 본문",
          },
        },
        required: ["recommendation"],
        additionalProperties: false,
      },
    }),
  });
}

async function listManusMessages(apiKey, taskId) {
  const query = new URLSearchParams({
    task_id: taskId,
    order: "asc",
    limit: "50",
  });
  return fetchManus(`/task.listMessages?${query.toString()}`, apiKey, {
    method: "GET",
    headers: {},
  });
}

async function runManusPrompt(input, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const apiKey = (process.env.MANUS_API_KEY || "").trim();
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      body: { error: "Missing MANUS_API_KEY" },
    };
  }

  const prompt = buildRecommendationPrompt(input);
  const created = await createManusTask(apiKey, prompt);
  const taskId = created.task_id;

  if (!taskId) {
    throw new Error("Manus task_id is missing");
  }

  const startedAt = Date.now();
  const maxPolls = Math.min(MAX_POLLS, Math.ceil(timeoutMs / POLL_INTERVAL_MS));

  for (let index = 0; index < maxPolls; index += 1) {
    if (Date.now() - startedAt >= timeoutMs) {
      break;
    }

    await sleep(POLL_INTERVAL_MS);

    let messageData;
    try {
      messageData = await listManusMessages(apiKey, taskId);
    } catch (error) {
      const message = String(error?.message || error);
      if (/task not found/i.test(message) && index < MAX_POLLS - 1) {
        continue;
      }
      throw error;
    }

    const messages = Array.isArray(messageData?.messages) ? messageData.messages : [];
    const status = findLatestStatus(messages);
    const agentStatus = status?.agent_status || "";
    const structured = findStructuredResult(messages);
    const assistantText = findAssistantText(messages);

    if (structured?.success && structured?.value?.recommendation) {
      return {
        ok: true,
        status: 200,
        body: {
          text: String(structured.value.recommendation).trim(),
          model: "Manus",
          taskId,
          taskUrl: created.task_url || "",
        },
      };
    }

    if (assistantText && assistantText.includes("이번 모임에서는")) {
      return {
        ok: true,
        status: 200,
        body: {
          text: assistantText,
          model: "Manus",
          taskId,
          taskUrl: created.task_url || "",
          source: "assistant_message_early",
        },
      };
    }

    if (agentStatus === "stopped") {
      if (assistantText) {
        return {
          ok: true,
          status: 200,
          body: {
            text: assistantText,
            model: "Manus",
            taskId,
            taskUrl: created.task_url || "",
            source: "assistant_message",
          },
        };
      }

      return {
        ok: false,
        status: 502,
        body: {
          error: structured?.error || "Manus task completed without a recommendation",
          taskId,
          taskUrl: created.task_url || "",
        },
      };
    }

    if (agentStatus === "error") {
      return {
        ok: false,
        status: 502,
        body: {
          error: findErrorText(messages) || "Manus task failed",
          taskId,
          taskUrl: created.task_url || "",
        },
      };
    }

    if (agentStatus === "waiting") {
      return {
        ok: false,
        status: 409,
        body: {
          error: status?.status_detail?.waiting_description || "Manus task is waiting for input",
          taskId,
          taskUrl: created.task_url || "",
        },
      };
    }
  }

  return {
    ok: false,
    status: 504,
    body: {
      error: "Manus response timed out. 잠시 후 다시 시도해 주세요.",
      taskId,
      taskUrl: created.task_url || "",
    },
  };
}

export default async (req) => {
  const origin = req.headers.get("origin") || "";
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405, headers);
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Forbidden origin" }, 403, headers);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, headers);
  }

  const title = String(body?.title || "").trim();
  const author = String(body?.author || "").trim();
  const description = String(body?.description || "").trim();
  const quote = String(body?.quote || "").trim();
  const timeoutMs = normalizeTimeoutMs(body?.timeoutMs);

  if (!title || !author || !description) {
    return jsonResponse({ error: "Missing title, author, or description" }, 400, headers);
  }

  try {
    const result = await runManusPrompt({ title, author, quote, description }, timeoutMs);
    return jsonResponse(result.body, result.status, headers);
  } catch (error) {
    return jsonResponse({ error: String(error?.message || error) }, 502, headers);
  }
};
