# FinTrack

FinTrack is a React and Express personal-finance application. The current backend module implements secure, JWT-based user authentication; finance data endpoints are intentionally not included yet.

## Run locally

1. In `server/.env`, set `PORT`, `MONGO_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`. Use `server/.env.example` as the safe template. `JWT_SECRET` should be a long, random value and `JWT_EXPIRES_IN` can be a duration such as `7d`.
2. Start the API with `cd server && npm run dev`.
3. Start the React app with `cd client && npm run dev`.

The client defaults to `http://localhost:5000/api`. Override it with `VITE_API_URL` in a client environment file when deploying. The API accepts the frontend origin set by `CLIENT_URL` (default `http://localhost:5173`).

## Authentication architecture

### Server

- `server/server.js` — Application entry point. It loads environment variables, configures CORS/JSON parsing, mounts the auth routes, and only starts listening after MongoDB connects.
- `server/.env.example` — Safe configuration template. It documents required environment names without exposing credentials; the real `.env` remains local and is ignored by Git.
- `server/config/db.js` — Database configuration. It opens the Mongoose connection from `MONGO_URI`, keeping infrastructure setup outside route code.
- `server/models/User.js` — User persistence model. It lives in `models` because it maps MongoDB user documents and hashes passwords with bcrypt before they are stored.
- `server/controllers/authController.js` — Authentication request handlers. Controllers receive route input, validate it, call the User model, and return login/signup/session responses.
- `server/routes/authRoutes.js` — Authentication URL map. It connects `/api/auth/signup`, `/login`, and `/me` to controllers and protection middleware.
- `server/middleware/authMiddleware.js` — Bearer-token guard. It verifies the JWT, loads the user, and passes the authenticated user to protected controllers.
- `server/middleware/errorMiddleware.js` — Central error layer. It provides consistent 404 and server-error responses instead of duplicating error handling in every route.
- `server/utils/token.js` — Token utility. It creates signed JWTs from `JWT_SECRET` and `JWT_EXPIRES_IN`, keeping secret-dependent logic reusable and isolated.
- `server/utils/sendAuthResponse.js` — Response utility. It creates the token and returns only safe user fields for both signup and login.

### Client

- `client/src/services/api.js` — Shared Axios client. It is in `services` because it owns HTTP configuration and automatically attaches `Authorization: Bearer <token>` from localStorage.
- `client/src/services/authService.js` — Auth API wrapper. UI components use its concise `signup`, `login`, and `getMe` methods rather than calling Axios directly.
- `client/src/context/AuthContext.jsx` — Global session state. It restores a saved token through `/api/auth/me`, stores successful tokens, and makes login/signup/logout available to the UI.
- `client/src/context/authStore.js` — Context definition. It is separate from the provider to keep React Fast Refresh boundaries clean.
- `client/src/hooks/useAuth.js` — Auth-consumption hook. Components import this helper instead of knowing the context implementation details.
- `client/src/components/auth/ProtectedRoute.jsx` — Route-level access control. It waits for session restoration and redirects unauthenticated visitors away from the app layout.
- `client/src/App.jsx` — Route composition. It combines the auth provider with public, protected, and authenticated-only routes.
- `client/src/pages/AuthPage.jsx` — Existing login/signup UI, now connected only through AuthContext; the visual design remains unchanged while it displays API errors and submit state.
- `client/src/layouts/AppLayout.jsx` — Existing app shell, now calls AuthContext logout to clear the session before returning home.

## API endpoints

- `POST /api/auth/signup` — Validates fields and email, hashes the password, creates the user, and returns a JWT plus safe user data.
- `POST /api/auth/login` — Validates credentials with bcrypt and returns a JWT plus safe user data.
- `GET /api/auth/me` — Protected route. Requires `Authorization: Bearer <token>` and restores the current user session.

## Income module

The Income module is the reference structure for Expenses, Budget, Goals, and Dashboard work. Every request uses the existing JWT middleware, and every data query is constrained to the authenticated user's ID.

- `server/models/Income.js` — Income persistence model. It owns the user reference, category, amount, optional description, date, timestamps, and compound user/date/category indexes for efficient month queries.
- `server/controllers/incomeController.js` — Income business handlers. It validates payloads, builds user-scoped month/search/category queries, applies sorting, and prevents cross-user edits or deletes.
- `server/routes/incomeRoutes.js` — Protected Income URL map. It applies `requireAuth` before exposing the CRUD controller actions.
- `client/src/services/incomeService.js` — Income HTTP wrapper. It keeps Axios calls out of the page and uses the shared client for Bearer authentication.
- `client/src/utils/calculations/incomeCalculations.js` — Income presentation calculations. It derives totals, count, highest amount, average amount, and standardises money/date/month formatting.
- `client/src/utils/validators/incomeValidator.js` — Client form validator. It provides immediate, consistent category, amount, date, and description feedback before an API call.
- `client/src/pages/IncomePage.jsx` — Responsive Income UI. It manages month navigation, query controls, loading/empty states, CRUD modals, and toast feedback while delegating data work to the service and utility layers.

### Income API endpoints

All endpoints require `Authorization: Bearer <token>`.

- `POST /api/income` — Creates an income record for the current user. Requires `category`, positive `amount`, and `date`; `description` is optional.
- `GET /api/income?month=YYYY-MM&description=&category=&amountMin=&amountMax=&dateFrom=&dateTo=&sort=latest` — Returns only the current user's records for the requested month. Supports category, description, amount range, date range, and `latest`, `oldest`, `highest`, or `lowest` sort orders.
- `PUT /api/income/:id` — Validates and updates only a record belonging to the current user.
- `DELETE /api/income/:id` — Deletes only a record belonging to the current user and returns `204 No Content`.

### Income workflow

1. The protected Income route loads and sends the JWT through the shared Axios interceptor.
2. The API verifies the JWT, attaches the user, and limits MongoDB reads/writes to that user.
3. The page fetches the chosen month and recalculates summary cards from the returned database records.
4. Adding, editing, or deleting uses the service layer, shows a toast result, and refreshes the current month without reloading the app.
