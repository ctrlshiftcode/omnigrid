import figlet from "figlet";
import { healthRoutes } from "./health";

export const apiRoutes = {
  "/figlet": () => new Response(figlet.textSync("BUN SERVER")),
  ...healthRoutes,
};