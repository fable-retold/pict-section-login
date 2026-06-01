# API Reference

Every developer-facing method, property, and override hook on `PictSectionLogin`. Signatures follow the source in `source/Pict-Section-Login.js`.

`PictSectionLogin` extends [`pict-view`](https://fable-retold.github.io/pict-view/), so it inherits all of the standard view lifecycle methods (`render`, `solve`, `initialize`, `onBeforeInitialize`, `onAfterRender`, `onAfterInitialRender`) in addition to the login-specific surface below.

## Public State

Instance properties that the view maintains and that your code is welcome to read (but should generally not write directly):

### `this.authenticated`

- **Type:** `boolean`
- **Default:** `false`
- `true` after a successful `login()` or a successful `checkSession()` that returned `LoggedIn: true`.
- Reset to `false` by `logout()`.

### `this.sessionData`

- **Type:** `object | null`
- **Default:** `null`
- The most recent session object returned from the backend. Mirrored to `options.SessionDataAddress` via `fable.manifest.setValueByHash`.
- Cleared by `logout()`.

### `this.oauthProviders`

- **Type:** `array`
- **Default:** `[]`
- Populated by `loadOAuthProviders()`. Each element is whatever the backend returned; `Name` is required, `BeginURL` is optional.

### `this.initialRenderComplete`

- **Type:** `boolean`
- **Default:** `false`
- Internal flag; `true` after `onAfterInitialRender()` has run for the first time. Used to guard against duplicate CSS injection and duplicate session checks.

## Authentication Methods

### `login(pUsername, pPassword, fCallback)`

Authenticates against `options.LoginEndpoint`.

| Param | Type | Description |
|---|---|---|
| `pUsername` | `string` | The user-supplied username. |
| `pPassword` | `string` | The user-supplied password. |
| `fCallback` | `function(pError, pSessionData)` | Optional. Called with an error string on failure or the session object on success. |

Behavior:

1. When `options.LoginMethod === 'POST'` (the default), sends `POST options.LoginEndpoint` with body `{ UserName, Password }` and `Content-Type: application/json`.
2. When `options.LoginMethod === 'GET'`, sends `GET options.LoginEndpoint/:encodedUsername/:encodedPassword`.
3. On success (response has `LoggedIn === true`):
	- Sets `this.authenticated = true`.
	- Assigns the response to `this.sessionData`.
	- Calls `fable.manifest.setValueByHash(..., options.SessionDataAddress, sessionData)`.
	- Renders the status bar (replaces the form).
	- Calls `this.onLoginSuccess(sessionData)`.
	- Calls `this.pict.PictApplication.solve()` when that method is available.
	- Invokes `fCallback(null, sessionData)`.
4. On failure:
	- Renders the error template with the response's message.
	- Calls `this.onLoginFailed(errorMessage)`.
	- Invokes `fCallback(errorMessage)`.

Called automatically when the user submits the login form; you rarely need to call it directly unless you are driving the view programmatically (tests, SSO handoff, etc.).

### `logout(fCallback)`

Ends the current session.

| Param | Type | Description |
|---|---|---|
| `fCallback` | `function(pError)` | Optional. Called when the logout flow finishes. |

Behavior:

1. Sends `GET options.LogoutEndpoint`.
2. Regardless of the network outcome, clears local state:
	- `this.authenticated = false`
	- `this.sessionData = null`
	- `fable.manifest.setValueByHash(..., options.SessionDataAddress, null)`
3. Re-renders the login form (replaces the status bar).
4. Calls `this.onLogout()`.
5. Calls `this.pict.PictApplication.solve()` when that method is available.
6. Invokes `fCallback(null)` or `fCallback(errorString)`.

Wired up automatically to the logout button in the status bar template. Call it manually from an application-level logout action if your application has its own logout affordance (e.g. a menu item).

### `checkSession(fCallback)`

Validates the current session against `options.CheckSessionEndpoint`.

| Param | Type | Description |
|---|---|---|
| `fCallback` | `function(pError, pSessionData)` | Optional. Called with an error string on network failure or the session object (which may have `LoggedIn: false`) on success. |

Behavior:

1. Sends `GET options.CheckSessionEndpoint`.
2. If the response has `LoggedIn === true`:
	- Sets `this.authenticated = true`.
	- Assigns the response to `this.sessionData`.
	- Writes the session to `options.SessionDataAddress`.
	- Renders the status bar.
3. If `LoggedIn` is not true, leaves the login form visible.
4. Calls `this.onSessionChecked(sessionData)` (or `this.onSessionChecked(null)` on network failure).
5. Invokes `fCallback(pError, sessionData)`.

Called automatically after the first render when `options.CheckSessionOnLoad === true` (the default). Call it manually when you want the host application to control the timing (e.g. `CheckSessionOnLoad: false` plus a call from `PictApplication.onAfterInitializeAsync`).

### `loadOAuthProviders(fCallback)`

Fetches the OAuth provider list from `options.OAuthProvidersEndpoint`.

| Param | Type | Description |
|---|---|---|
| `fCallback` | `function(pError, pProviders)` | Optional. Called with an array of providers on success. |

Behavior:

1. Sends `GET options.OAuthProvidersEndpoint`.
2. Stores the returned `Providers` array in `this.oauthProviders`.
3. Renders the OAuth button row into `#pict-login-oauth-area`.
4. Each button's click navigates the browser to `<OAuthBeginEndpoint>/<providerName>` (or to `provider.BeginURL` if the provider object supplies one).
5. Invokes `fCallback(pError, providers)`.

Called automatically after the first render when `options.ShowOAuthProviders === true`.

## Override Hooks

These methods are no-ops by default. Subclass `PictSectionLogin` and override them to hook application logic into the auth flow. The framework calls them at the right time -- you never call them directly.

### `onLoginSuccess(pSessionData)`

Called after a successful `login()`.

| Param | Type | Description |
|---|---|---|
| `pSessionData` | `object` | The session object returned from the backend. Always has `LoggedIn: true`. |

Typical use:

- Show the application shell (e.g. `this.pict.PictApplication.showProtectedApp()`).
- Redirect to a stored pending route (`this.pict.providers.PictRouter.navigate(this.pict.AppData.PendingRoute || '/Dashboard')`).
- Fire analytics.
- Load additional user data.

### `onLoginFailed(pError)`

Called after a failed `login()`.

| Param | Type | Description |
|---|---|---|
| `pError` | `string` | Human-readable error message from the backend or the network layer. |

Typical use:

- Fire analytics on failed attempts.
- Show a custom error modal instead of the inline error template.
- Track rate limiting / lockout state.

### `onLogout()`

Called after a successful `logout()`.

No parameters.

Typical use:

- Show the login view and hide the protected shell (`this.pict.PictApplication.showLogin()`).
- Clear application-level caches or in-memory state.
- Navigate to a public landing page.

### `onSessionChecked(pSessionData)`

Called after `checkSession()` completes.

| Param | Type | Description |
|---|---|---|
| `pSessionData` | `object \| null` | The session object on success (may be `{ LoggedIn: false }`), or `null` on network failure. |

Typical use:

- Detect a restored session on app load and show the protected shell without requiring the user to re-enter credentials.
- Detect an expired session and show the login view with an appropriate message.
- Drive a "restoring session" splash screen off of the timing of this callback.

## Lifecycle Hooks (Inherited from pict-view)

`PictSectionLogin` overrides three standard lifecycle hooks. If you override them in a subclass, call `super.<method>(...)` first so the base behavior still runs.

### `onBeforeInitialize()`

Called before the view is initialized. Used internally to reset state before the first render. Override to run subclass-level setup that must happen before templates are registered.

### `onAfterRender(pRenderable)`

Called after each render pass. Used internally to:

1. Inject CSS via `this.pict.CSSMap.injectCSS()` (first render only).
2. Render the login form or status bar into the wrapper based on `this.authenticated`.
3. Wire up the submit handler and logout button.

Override carefully -- call `super.onAfterRender(pRenderable)` first and then add subclass-level DOM work.

### `onAfterInitialRender()`

Called once after the first render. Used internally to:

1. Run `checkSession()` when `CheckSessionOnLoad === true`.
2. Run `loadOAuthProviders()` when `ShowOAuthProviders === true`.
3. Set `this.initialRenderComplete = true`.

Override if you want to run one-time subclass setup that depends on the DOM being ready.

## Static Exports

### `PictSectionLogin.default_configuration`

The default configuration object (see [Configuration](configuration.md) for every key). Exported so you can merge it with your own options:

```javascript
const libPictSectionLogin = require('pict-section-login');
const tmpDefaults = libPictSectionLogin.default_configuration;

const tmpOptions = Object.assign({}, tmpDefaults, {
	"LoginEndpoint": "/api/auth/login"
});
```

## Error Handling Contract

The view does its best to keep the UI consistent with server state:

- Network failures are surfaced as strings through the error hook and the inline error template.
- `logout()` always clears local state, even if the server is unreachable. The user should never be stuck in an "I can't log out" loop.
- `checkSession()` treats a network failure as "session unknown" -- it calls `onSessionChecked(null)` and leaves the UI untouched.
- `login()` treats any response without `LoggedIn === true` as a failure, regardless of HTTP status. This is intentional: some backends return 200 with a failure flag.
