# FinTrack

FinTrack is a personal finance tracker built with React, Vite, Express, and MongoDB. It lets signed-in users manage income, expenses, monthly budgets, and savings goals, and review their finances in a dashboard. Optional AI-generated dashboard insights use aggregated financial data.

## Features

- Sign up, log in, and restore an authenticated session with JWTs.
- Record and filter monthly income and expenses, with category, amount, date, and description filters.
- Create and manage monthly spending budgets by category.
- Create savings goals and adjust their saved amounts.
- View yearly income and expense trends in the dashboard.
- Request monthly financial suggestions and progress insights through OpenRouter.
- Keep financial records scoped to the authenticated user.

## Requirements

- Node.js and npm
- A MongoDB database, local or hosted
- An OpenRouter API key only if you want AI dashboard insights

## Run locally

1. Configure the API environment:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

   Edit `server/.env` and set `MONGO_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`. The example file includes defaults for the API port and client origin. Set `OPENROUTER_API_KEY` to enable AI insights; it is optional for the rest of the app. Keep the real `.env` file private and do not commit secrets.

2. Install and start the API in a terminal:

   ```powershell
   cd server
   npm install
   npm run dev
   ```

   The API listens on port `5000` by default and waits for MongoDB to connect before it starts. `npm start` runs the server without nodemon.

3. Install and start the web client in a second terminal:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

   Vite prints the local client URL, normally `http://localhost:5173`. The client calls `http://localhost:5000/api` by default. Set `VITE_API_URL` in a client environment file to use a different API base URL.

## Environment configuration

The API loads configuration from `server/.env`:

- `PORT` — API port; defaults to `5000`.
- `MONGO_URI` — MongoDB connection string. Required.
- `JWT_SECRET` — Secret used to sign authentication tokens. Required; use a long, random value.
- `JWT_EXPIRES_IN` — Token lifetime, such as `7d`. Required.
- `CLIENT_URL` — Allowed browser origin for CORS; defaults to `http://localhost:5173`.
- `OPENROUTER_API_KEY` — Enables AI-generated insights. Optional.

The Vite client reads `VITE_API_URL`; when unset, its API service uses `http://localhost:5000/api`.

## App pages

- `/` — Landing page.
- `/login` and `/signup` — Authentication pages.
- `/app/income` — Income records.
- `/app/expenses` — Expense records.
- `/app/budget` — Monthly category budgets.
- `/app/goals` — Savings goals.
- `/app/dashboard` — Financial summaries, charts, and AI insights.

All `/app` pages require an authenticated session.

## API overview

The API runs under `/api`. Except for health and authentication signup/login, endpoints require the header `Authorization: Bearer <token>`.

- `GET /api/health` — Checks that the API process is responding.
- `POST /api/auth/signup` — Creates an account.
- `POST /api/auth/login` — Authenticates and returns a token.
- `GET /api/auth/me` — Returns the signed-in user for session restoration.
- `GET /api/income?month=YYYY-MM` — Lists income for a month. Supports `category`, `description`, `amountMin`, `amountMax`, `dateFrom`, `dateTo`, and `sort` filters.
- `POST /api/income` — Creates an income record.
- `PUT /api/income/:id` and `DELETE /api/income/:id` — Update or delete an income record.
- `GET /api/expenses?month=YYYY-MM` — Lists expenses for a month. Supports the same filters as income.
- `POST /api/expenses` — Creates an expense record.
- `PUT /api/expenses/:id` and `DELETE /api/expenses/:id` — Update or delete an expense record.
- `GET /api/budgets?month=YYYY-MM` — Lists budgets, optionally filtered by month.
- `POST /api/budgets` — Creates a monthly category budget.
- `PUT /api/budgets/:id` and `DELETE /api/budgets/:id` — Update or delete a budget.
- `GET /api/goals` — Lists savings goals.
- `POST /api/goals` — Creates a savings goal.
- `PUT /api/goals/:id` and `DELETE /api/goals/:id` — Update or delete a goal.
- `PUT /api/goals/:id/savings` — Adds to or subtracts from a goal's saved amount using an `amount` in the request body.
- `GET /api/dashboard/yearly-income-expenses?year=YYYY` — Returns a 12-month income and expense series for a year.
- `POST /api/ai/dashboard-insights` — Generates insights for a month; provide `{ "month": "YYYY-MM" }` in the request body. Requires `OPENROUTER_API_KEY`.

Income and expense sorting accepts `latest`, `oldest`, `highest`, or `lowest`. Create and update requests validate their fields; records can only be accessed or changed by their owner.

## Project structure

- `client/` — React application, Vite configuration, pages, charts, shared API services, and styles.
- `server/` — Express API, MongoDB models, authentication middleware, route handlers, and AI insight services.
- `server/config/` — Database connection setup.
- `server/controllers/` — Request validation and application logic for each API area.
- `server/models/` — Mongoose schemas for users and finance records.
- `server/routes/` — API route definitions.
- `server/services/` — AI provider integration and aggregate financial summary builder.
- `client/src/pages/` — Landing, authentication, and finance pages.
- `client/src/services/` — API wrappers used by the client pages.

## Client scripts

Run these from `client/`:

- `npm run dev` — Start the Vite development server.
- `npm run build` — Build the production client into `client/dist/`.
- `npm run preview` — Preview the production build locally.
- `npm run lint` — Run ESLint.

## Notes

- AI insights are optional. Requests to `/api/ai/dashboard-insights` return a configuration error when `OPENROUTER_API_KEY` is missing.
- Financial amounts are displayed as INR in the AI summary builder.
- `server/.env` contains secrets and should remain untracked.
