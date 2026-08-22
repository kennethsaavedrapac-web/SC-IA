import actionHandler from "./2fa/[action].js";

export default async function handler(req, res) {
  return actionHandler(req, res);
}
