import { API_CONTEXT_PATH } from "../config/api";

export const healthRoutes = {
  [`${API_CONTEXT_PATH}/health`]: () => Response.json({ status: "UP" }),
};