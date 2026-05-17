// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- `.open-next/worker.js` may not exist before the OpenNext build.
// @ts-ignore
import handler from "../.open-next/worker.js";

export default {
  fetch: handler.fetch,
};
