# Pict Section Login

> A drop-in login section for Pict applications

Pict Section Login is a `pict-view` subclass that renders a styled authentication form, talks to a REST backend (the default endpoints match [orator-authentication](https://github.com/fable-retold/orator-authentication), but everything is configurable), stores the resulting session on the Pict AppData tree, and exposes override hooks so you can chain navigation, route resolution, or any other post-auth behavior.

The view ships with:

- A container template with a styled card, an error strip, a form area, an OAuth area, and a status area
- A login form template (username + password + submit)
- A logged-in status bar with user name, user id, and logout button
- An OAuth providers row that fetches and renders provider buttons
- An error template for inline error display
- An embedded CSS design system covering all of the above

Everything is replaceable via the `Templates` array in the configuration, and the entire visual layer can be restyled by overriding the `CSS` block or simply applying your own rules on top of the `.pict-login-*` classes.

## Features

- **Drop-In View** -- Extends `pict-view`; register via `pict.addView(...)` and call `render()`
- **Orator-Authentication Ready** -- Default endpoints match the standard orator-authentication routes
- **Custom Backend Friendly** -- `LoginEndpoint`, `LogoutEndpoint`, `CheckSessionEndpoint`, and OAuth endpoints are all configurable; POST (JSON body) and GET (URL-encoded) are both supported for login
- **Session Management** -- `login`, `logout`, and `checkSession` methods plus automatic check-on-load via `CheckSessionOnLoad`
- **OAuth Provider Support** -- `loadOAuthProviders()` fetches the provider list and renders buttons that redirect through `OAuthBeginEndpoint`
- **AppData Integration** -- Session data is written to a configurable Pict manifest address (default `AppData.Session`) so any template solver or view can read it
- **Override Hooks** -- `onLoginSuccess`, `onLoginFailed`, `onLogout`, `onSessionChecked` hooks let you chain navigation or app-level state changes
- **Router Friendly** -- Designed to cooperate with [pict-router](https://github.com/fable-retold/pict-router) for route-guarded navigation and post-login redirects
- **Styled Out of the Box** -- Embedded CSS design system renders a polished card with no extra styling required
- **No Token Handling** -- Assumes the backend uses secure HTTP-only cookies; the view never touches `localStorage` or `sessionStorage`

## When to Use It

Reach for this view when your Pict application needs to:

- Show a login screen before any protected content is rendered
- Integrate with `orator-authentication` or any REST auth backend that exposes `authenticate` / `deauthenticate` / `checksession` semantics
- Display OAuth provider buttons alongside a traditional username/password form
- Protect routes via `pict-router` and redirect users to their intended page after signing in
- Provide a consistent session-aware status bar across an application shell

Skip it if your application needs a custom-designed login screen that does not resemble the built-in card layout -- you can still use the `login` / `logout` / `checkSession` methods directly from any view, but the rendering layer assumes the bundled templates.

## Learn More

- [Quick Start](quickstart.md) -- Install, register, and render your first login form
- [Embedding Guide](embedding-guide.md) -- How to place the login inside an existing Pict application, including shell layouts and auth-gated rendering
- [Router Integration](router-integration.md) -- Full pattern for `pict-router` route guards, pending-route redirects, and post-login navigation
- [Templates & Styling](templates-and-styling.md) -- Override the container, form, status, OAuth, and error templates; customize the CSS design system
- [Architecture](architecture.md) -- Class hierarchy, state diagram, and request flow
- [Configuration](configuration.md) -- Every key in `default_configuration` with defaults and descriptions
- [API Reference](api-reference.md) -- Every public method, parameter, callback signature, and override hook
- [Code Snippets](code-snippets.md) -- A runnable snippet for each exposed function
