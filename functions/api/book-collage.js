import handler from "../../netlify/functions/book-collage.js";
import { runNetlifyHandler } from "../_lib/netlifyCompat.js";

export function onRequest(context) {
  return runNetlifyHandler(handler, context);
}
