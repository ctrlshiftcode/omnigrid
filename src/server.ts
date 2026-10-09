import figlet from "figlet";
import { APP_TITLE } from "./config/app";
import { apiRoutes } from "./routes/index";

const indexHtml = Bun.file(new URL("./web/index.html", import.meta.url));

const server = Bun.serve({
  port: Number(Bun.env.PORT ?? 3000),
  routes: {
    "/": async () => new Response(
      (await indexHtml.text()).replaceAll("{{APP_TITLE}}", APP_TITLE),
      {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    ),
    "/tailwind.css": () => new Response(
      Bun.file(new URL("./web/tailwind.generated.css", import.meta.url)),
      { headers: { "Content-Type": "text/css; charset=utf-8" } },
    ),
    "/app.js": () => new Response(
      Bun.file(new URL("./web/app.generated.js", import.meta.url)),
      { headers: { "Content-Type": "application/javascript; charset=utf-8" } },
    ),
    ...apiRoutes,
  }
});


console.clear();
console.log(figlet.textSync('BUN SERVER'));
console.log(`Running on ${server.url}`);
