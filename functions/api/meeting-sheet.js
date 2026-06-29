import handler from "../../netlify/functions/meeting-sheet.js";
import { runNetlifyHandler } from "../_lib/netlifyCompat.js";

export function onRequest(context) {
  return runNetlifyHandler(handler, context);
}
