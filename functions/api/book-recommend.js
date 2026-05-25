import handler from "../../netlify/functions/book-recommend.js";
import { runNetlifyHandler } from "../_lib/netlifyCompat.js";

export function onRequest(context) {
  return runNetlifyHandler(handler, context);
}
