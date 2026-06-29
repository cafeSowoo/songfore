const ALLOWED_ORIGINS = new Set([
  "https://songfore.com",
  "https://www.songfore.com",
  "http://127.0.0.1:4173",
  "http://localhost:8888",
  "http://localhost:5173",
  "http://localhost:3000",
]);

const DEFAULT_SPREADSHEET_ID = "1d9XXe85v0FPHKKxLYYjde90XheA5hE2Xz5YDeiDWNVc";
const ATTENDANCE_SHEET = "출석부";
const BOOK_SHEET = "모임 책 목록";
const VALID_STATUSES = new Set(["참석", "지각", "신입", "신입(지각)", "취소"]);

let tokenCache = null;

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
  });
}

function getSpreadsheetId() {
  return (process.env.SONGFORE_ATTENDANCE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID).trim();
}

function readServiceAccount() {
  const rawJson = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "").trim();
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    return {
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  }

  return {
    clientEmail: (
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      process.env.GOOGLE_CLIENT_EMAIL ||
      ""
    ).trim(),
    privateKey: (
      process.env.GOOGLE_PRIVATE_KEY ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      ""
    ).trim(),
  };
}

function base64Url(input) {
  let bytes;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem) {
  const normalized = String(pem || "").replace(/\\n/g, "\n");
  const base64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function signJwt(unsignedJwt, privateKey) {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedJwt),
  );

  return `${unsignedJwt}.${base64Url(signature)}`;
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.accessToken;
  }

  const { clientEmail, privateKey } = readServiceAccount();
  if (!clientEmail || !privateKey) {
    throw new Error("Google service account environment variables are not configured.");
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  const assertion = await signJwt(unsignedJwt, privateKey);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok) {
    throw new Error(tokenData.error_description || tokenData.error || "Google token request failed.");
  }

  tokenCache = {
    accessToken: tokenData.access_token,
    expiresAt: now + Number(tokenData.expires_in || 3600),
  };
  return tokenCache.accessToken;
}

function quoteSheetName(sheetName) {
  return `'${String(sheetName).replace(/'/g, "''")}'`;
}

async function sheetsFetch(path, options = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || data?.error || "Google Sheets request failed.";
    throw new Error(message);
  }
  return data;
}

async function getSheetValues(spreadsheetId, ranges) {
  const params = new URLSearchParams();
  ranges.forEach((range) => params.append("ranges", range));
  params.set("majorDimension", "ROWS");
  params.set("valueRenderOption", "FORMATTED_VALUE");

  const data = await sheetsFetch(`${spreadsheetId}/values:batchGet?${params.toString()}`);
  return data.valueRanges || [];
}

async function updateSheetValues(spreadsheetId, data) {
  return sheetsFetch(`${spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data,
    }),
  });
}

function columnToLetter(index) {
  let value = index;
  let letters = "";
  while (value >= 0) {
    letters = String.fromCharCode((value % 26) + 65) + letters;
    value = Math.floor(value / 26) - 1;
  }
  return letters;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeDate(value) {
  const text = normalizeText(value).replace(/\.$/, "");
  const match = text.match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function formatSheetDate(value) {
  const normalized = normalizeDate(value);
  if (!normalized) return normalizeText(value);
  const [year, month, day] = normalized.split("-");
  return `${year}.${month}.${day}`;
}

function rowValue(rows, rowIndex, colIndex) {
  return rows[rowIndex]?.[colIndex] ?? "";
}

function parseNo(value) {
  const number = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(number) ? number : null;
}

function analyzeSheetState(attendanceRows, bookRows, requestedDate) {
  const dateKey = normalizeDate(requestedDate);
  const dateHeader = attendanceRows[0] || [];
  const titleHeader = attendanceRows[1] || [];
  const knownDates = [];
  let lastDateCol = 1;
  let existingDateCol = -1;

  dateHeader.forEach((value, index) => {
    const normalized = normalizeDate(value);
    if (!normalized) return;
    knownDates.push({
      date: normalized,
      title: titleHeader[index] || "",
      column: columnToLetter(index),
      colIndex: index,
    });
    lastDateCol = Math.max(lastDateCol, index);
    if (dateKey && normalized === dateKey) {
      existingDateCol = index;
    }
  });

  const targetAttendanceCol = existingDateCol >= 0 ? existingDateCol : lastDateCol + 1;
  const members = attendanceRows
    .map((row, index) => ({
      name: normalizeText(row[0]),
      status: normalizeText(row[1]),
      rowNumber: index + 1,
    }))
    .filter((member) => member.rowNumber >= 3 && member.name && member.status !== "탈퇴");

  let lastCompletedNo = 0;
  let firstEmptyNumberRow = -1;
  let existingBookRow = -1;

  bookRows.forEach((row, index) => {
    const rowNumber = index + 1;
    if (rowNumber <= 3) return;

    const no = parseNo(row[0]);
    const rowDate = normalizeDate(row[1]);
    const hasBookData = [row[1], row[2], row[3], row[4], row[5], row[6], row[7]]
      .some((value) => normalizeText(value));

    if (no && hasBookData) {
      lastCompletedNo = Math.max(lastCompletedNo, no);
    }

    if (dateKey && rowDate === dateKey) {
      existingBookRow = rowNumber;
    }

    if (firstEmptyNumberRow < 0 && no && !hasBookData) {
      firstEmptyNumberRow = rowNumber;
    }
  });

  const targetBookRow = existingBookRow > 0
    ? existingBookRow
    : firstEmptyNumberRow > 0
      ? firstEmptyNumberRow
      : Math.max(bookRows.length + 1, 4);
  const targetNo = parseNo(rowValue(bookRows, targetBookRow - 1, 0)) || lastCompletedNo + 1;

  return {
    attendance: {
      sheet: ATTENDANCE_SHEET,
      targetColumn: columnToLetter(targetAttendanceCol),
      targetColIndex: targetAttendanceCol,
      dateExists: existingDateCol >= 0,
      latestMeetings: knownDates.slice(-8),
      memberCount: members.length,
      members,
    },
    books: {
      sheet: BOOK_SHEET,
      targetRow: targetBookRow,
      dateExists: existingBookRow > 0,
      suggestedNo: targetNo,
    },
  };
}

function countAttendees(attendance) {
  return attendance.filter((item) => {
    const status = normalizeText(item.status);
    return status && status !== "취소";
  }).length;
}

function sanitizeAttendance(attendance) {
  if (!Array.isArray(attendance)) return [];
  return attendance
    .map((item) => ({
      name: normalizeText(item.name),
      status: normalizeText(item.status),
    }))
    .filter((item) => item.name && VALID_STATUSES.has(item.status));
}

function validateAdmin(body, request) {
  const expected = (process.env.MEETING_ADMIN_TOKEN || "").trim();
  if (!expected) {
    throw new Error("MEETING_ADMIN_TOKEN is not configured.");
  }

  const auth = request.headers.get("authorization") || "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  const supplied = normalizeText(body.adminToken || bearer);
  if (!supplied || supplied !== expected) {
    const error = new Error("관리자 토큰이 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }
}

async function loadState(spreadsheetId, meetingDate) {
  const [attendanceRange, bookRange] = await getSheetValues(spreadsheetId, [
    `${quoteSheetName(ATTENDANCE_SHEET)}!A1:DJ260`,
    `${quoteSheetName(BOOK_SHEET)}!A1:H420`,
  ]);

  const attendanceRows = attendanceRange.values || [];
  const bookRows = bookRange.values || [];
  return analyzeSheetState(attendanceRows, bookRows, meetingDate);
}

async function handlePreview(body) {
  const spreadsheetId = getSpreadsheetId();
  const state = await loadState(spreadsheetId, body.meetingDate);
  return {
    ok: true,
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    ...state,
  };
}

async function handleSave(body) {
  const spreadsheetId = getSpreadsheetId();
  const meeting = body.meeting || {};
  const date = formatSheetDate(meeting.date);
  const title = normalizeText(meeting.title);
  const author = normalizeText(meeting.author);

  if (!normalizeDate(date)) {
    const error = new Error("모임 날짜를 입력해 주세요.");
    error.status = 400;
    throw error;
  }
  if (!title) {
    const error = new Error("도서명을 입력해 주세요.");
    error.status = 400;
    throw error;
  }
  if (!author) {
    const error = new Error("저자를 입력해 주세요.");
    error.status = 400;
    throw error;
  }

  const state = await loadState(spreadsheetId, meeting.date);
  const attendance = sanitizeAttendance(body.attendance);
  const memberRowByName = new Map(
    state.attendance.members.map((member) => [member.name, member.rowNumber]),
  );
  const attendanceColumn = state.attendance.targetColumn;
  const attendees = countAttendees(attendance);
  const meetingNo = normalizeText(meeting.no) || String(state.books.suggestedNo);

  const updates = [
    {
      range: `${quoteSheetName(ATTENDANCE_SHEET)}!${attendanceColumn}1:${attendanceColumn}2`,
      values: [[date], [title]],
    },
    {
      range: `${quoteSheetName(BOOK_SHEET)}!A${state.books.targetRow}:H${state.books.targetRow}`,
      values: [[
        meetingNo,
        date,
        title,
        author,
        normalizeText(meeting.category),
        normalizeText(meeting.recommender),
        attendees || "",
        normalizeText(meeting.note),
      ]],
    },
  ];

  attendance.forEach((item) => {
    const rowNumber = memberRowByName.get(item.name);
    if (!rowNumber) return;
    updates.push({
      range: `${quoteSheetName(ATTENDANCE_SHEET)}!${attendanceColumn}${rowNumber}`,
      values: [[item.status]],
    });
  });

  await updateSheetValues(spreadsheetId, updates);

  return {
    ok: true,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    updated: {
      attendanceRange: `${ATTENDANCE_SHEET}!${attendanceColumn}1:${attendanceColumn}${Math.max(
        2,
        ...attendance.map((item) => memberRowByName.get(item.name) || 2),
      )}`,
      bookRange: `${BOOK_SHEET}!A${state.books.targetRow}:H${state.books.targetRow}`,
      attendeeCount: attendees,
      savedAttendanceCount: attendance.length,
      targetNo: meetingNo,
    },
  };
}

export default async function handler(request) {
  const origin = request.headers.get("origin") || "";
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, headers);
  }

  try {
    const body = await request.json().catch(() => ({}));
    validateAdmin(body, request);

    if (body.action === "preview") {
      return jsonResponse(await handlePreview(body), 200, headers);
    }

    if (body.action === "save") {
      return jsonResponse(await handleSave(body), 200, headers);
    }

    return jsonResponse({ error: "Unknown action" }, 400, headers);
  } catch (error) {
    const status = error.status || (/configured|environment/i.test(error.message) ? 500 : 400);
    return jsonResponse({ error: error.message || "Request failed" }, status, headers);
  }
}
