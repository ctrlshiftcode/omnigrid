# OmniGrid

This application was created to evaluate Bun and its web development tooling.

Bun documentation:
https://bun.com/docs/quickstart

To install dependencies:

```bash
bun install
```

To run:

```bash
bun start
```

Demo: [https://omnigrid.onrender.com/](https://omnigrid.onrender.com/) <br>
Hosted in https://render.com/


## Screenshots

### CSV import

![OmniGrid CSV import screen](screenshots/01-upload.png)

### Data preview

![OmniGrid table with loaded CSV data](screenshots/02-data-preview.png)

### Workflow

![Selecting a CSV file, loading its rows, and sorting the table](screenshots/omnigrid-workflow.gif)

## Code map

| Path | Responsibility |
| --- | --- |
| `src/server.ts` | Application entry point. Starts `Bun.serve`, serves the HTML and generated frontend assets, injects `APP_TITLE`, and registers API routes. The port comes from `PORT` or defaults to `3000`. |
| `src/routes/index.ts` | Collects the API route handlers, including `/figlet` and the health route. |
| `src/routes/health.ts` | Implements the health response; its path is built from `API_CONTEXT_PATH` in `src/config/api.ts`. |
| `src/config/app.ts` | Defines the shared application title. |
| `src/web/index.html` | Defines the import controls and table markup used by the browser code. |
| `src/web/app.js` | Handles file selection, CSV parsing, table rendering, sorting, feedback, and clearing the current file. |
| `src/web/styles.css` | Tailwind entry point and custom daisyUI theme. |
| `src/web/app.generated.js`, `src/web/tailwind.generated.css` | Browser bundles built by the `build:js` and `build:css` scripts; edit their source files instead. |
| `test-data/omni-grid-500.csv` | Sample CSV for trying the import and table preview. |

### CSV import flow

1. Choosing or dropping a file calls `chooseFile`, which accepts `.csv` files up to 50 MB and resets any previous preview.
2. `parseSelectedFile` passes the file to PapaParse in the browser. The delimiter is detected automatically, blank lines are skipped, and the first row supplies the column names.
3. `renderTable` creates the table from the parsed values. Cells are populated with `textContent`, and missing values are displayed as empty cells.
4. Clicking a column heading sorts ascending; clicking it again reverses the order. Numeric values are compared numerically, other values use a numeric-aware English collator, and blank values stay last.
5. `clear-button` resets the selected file, parsed rows, and preview so another CSV can be loaded.

## Frontend

The page at `/` is a static HTML dashboard styled with Tailwind CSS 4 and daisyUI 5. Its CSS entry point is `src/web/styles.css`:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: omni-dark --default;
}
```

The custom `omni-dark` theme uses the violet palette and is defined in `src/web/styles.css`.

The `build:css` script uses `@tailwindcss/cli` to generate `src/web/tailwind.generated.css`. `build:js` bundles the browser code to `src/web/app.generated.js`; `bun start` builds both assets before starting the server.
By default, the server starts at `http://localhost:3000/` (port `3000`). Set `PORT` to a different port; for example, using port `4000` serves the app at `http://localhost:4000/`.

CSV files are parsed locally in the browser. The selected file is not uploaded to the server.
Drop a `.csv` file up to 50 MB and load it; PapaParse detects the delimiter automatically. The first row supplies the column names; click a column heading to sort ascending or descending.

## Dependencies and imports

| Package | Type | Import or use |
| --- | --- | --- |
| `figlet` | Runtime dependency | Imported in `src/server.ts` for the startup banner and `src/routes/index.ts` for `/figlet`. |
| `tailwindcss` | Development dependency | Loaded in `src/web/styles.css` with `@import "tailwindcss";`. |
| `daisyui` | Development dependency | Loaded as a Tailwind plugin in `src/web/styles.css`. |
| `@tailwindcss/cli` | Development dependency | Runs `build:css` to compile the frontend stylesheet. |
| `papaparse` | Development dependency | Imported by `src/web/app.js` for CSV parsing in the browser bundle. |

The shared HTML title is exported as `APP_TITLE` from `src/config/app.ts`, imported by `src/server.ts`, and inserted into the `{{APP_TITLE}}` token in each served page's `<title>` element.

## Endpoints

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/` | Serves the HTML application. |
| `GET` | `/tailwind.css` | Serves the compiled Tailwind and daisyUI stylesheet. |
| `GET` | `/app.js` | Serves the compiled browser application. |
| `GET` | `/figlet` | Plain text containing the Figlet rendering of `BUN SERVER`. |
| `GET` | `/omnigrid/health` | JSON health status: `{"status":"UP"}`. |

This project was created using `bun init` in bun v1.4.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
