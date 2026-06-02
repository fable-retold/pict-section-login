# Architecture

Pict Section Login is a single `pict-view` subclass that owns its own templates, CSS, state, and auth request logic. It leans on the standard Pict services (TemplateProvider, CSSMap, ContentAssignment, manifest) for rendering and state storage, and exposes four override hooks that let the host application react to auth state changes.

## Component Map

<!-- bespoke diagram: edit diagrams/component-map.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-section-login/docs -->
![Component Map](diagrams/component-map.svg)

## Class Hierarchy

```mermaid
classDiagram
	class libPictViewClass {
		+pict
		+services
		+options
		+log
		+render()
		+onBeforeInitialize()
		+onAfterRender()
		+onAfterInitialRender()
	}

	class PictSectionLogin {
		+authenticated : boolean
		+sessionData : object
		+oauthProviders : array
		+initialRenderComplete : boolean
		+login(pUsername, pPassword, fCallback)
		+logout(fCallback)
		+checkSession(fCallback)
		+loadOAuthProviders(fCallback)
		+onLoginSuccess(pSessionData)
		+onLoginFailed(pError)
		+onLogout()
		+onSessionChecked(pSessionData)
	}

	libPictViewClass <|-- PictSectionLogin
	PictSectionLogin ..> TemplateProvider : uses
	PictSectionLogin ..> CSSMap : uses
	PictSectionLogin ..> ContentAssignment : uses
	PictSectionLogin ..> manifest : uses
```

## Auth State Machine

```mermaid
stateDiagram-v2
	[*] --> Rendered: view.render()

	Rendered --> CheckingSession: CheckSessionOnLoad = true
	Rendered --> ShowingForm: CheckSessionOnLoad = false

	CheckingSession --> ShowingForm: no session
	CheckingSession --> ShowingStatus: session restored

	ShowingForm --> Authenticating: user submits form
	Authenticating --> ShowingStatus: success
	Authenticating --> ShowingForm: failure (error shown)

	ShowingStatus --> LoggingOut: user clicks Log out
	LoggingOut --> ShowingForm: complete (even on network failure)

	note right of ShowingStatus
		authenticated = true
		sessionData populated
		AppData.Session set
	end note

	note right of ShowingForm
		authenticated = false
		sessionData = null
		AppData.Session cleared
	end note
```

## Login Request Flow

<!-- bespoke diagram: edit diagrams/login-request-flow.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-section-login/docs -->
![Login Request Flow](diagrams/login-request-flow.svg)

## Initial Render Flow

<!-- bespoke diagram: edit diagrams/initial-render-flow.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-section-login/docs -->
![Initial Render Flow](diagrams/initial-render-flow.svg)

## State Members

`PictSectionLogin` carries a small amount of instance state:

| Member | Type | Description |
|---|---|---|
| `this.authenticated` | `boolean` | Whether a session is currently active. `true` after a successful `login` or `checkSession`. |
| `this.sessionData` | `object \| null` | The most recent session object returned from the backend. Mirrored to `options.SessionDataAddress`. |
| `this.oauthProviders` | `array` | The provider list fetched from `OAuthProvidersEndpoint`. Empty until `loadOAuthProviders` completes. |
| `this.initialRenderComplete` | `boolean` | Internal flag; `true` after `onAfterInitialRender` has run once. |

## Session Data Shape

The view treats the backend response as opaque except for a few keys:

| Key | Purpose |
|---|---|
| `LoggedIn` | Required. `true` means authenticated, anything else is treated as a failure. |
| `UserID` | Displayed in the status bar. |
| `UserRecord` | Optional object; `UserRecord.FullName` / `UserRecord.LoginID` are displayed. |

Any other fields are preserved verbatim in `this.sessionData` and at `SessionDataAddress`. You can include roles, feature flags, tenant ids, or anything else your backend returns.

## File Layout

```
pict-section-login/
├── README.md
├── package.json
├── source/
│   ├── Pict-Section-Login.js                     # main class
│   └── Pict-Section-Login-DefaultConfiguration.js # templates + CSS + defaults
├── test/
│   ├── Pict-Section-Login_tests.js               # Mocha TDD unit tests
│   └── Browser_Integration_tests.js              # Puppeteer headless tests
├── example_applications/
│   ├── orator_login/                             # minimal orator-authentication
│   ├── custom_login/                             # custom endpoints + hooks
│   ├── oauth_login/                              # OAuth providers
│   └── harness_app/                              # full login + router app
└── docs/
	├── README.md, _cover.md, _sidebar.md, _topbar.md
	├── quickstart.md
	├── architecture.md
	├── configuration.md
	├── api-reference.md
	├── code-snippets.md
	├── embedding-guide.md
	├── router-integration.md
	└── templates-and-styling.md
```

## Session Storage Policy

The view does not store tokens in `localStorage`, `sessionStorage`, or any browser storage. The backend is assumed to maintain the session via HTTP-only cookies (or any other credentialed mechanism that the browser carries automatically), and the view verifies that session via `CheckSessionEndpoint` on load.

Consequences:

- Refreshing the page works transparently if cookies are set correctly -- `checkSession` restores the session.
- XSS in the host application cannot steal tokens from storage because there are none.
- Cross-tab behavior is consistent -- both tabs see the same server-side session.
- Logging out in one tab does not automatically log out in another; call `checkSession` periodically if you need cross-tab coordination.
