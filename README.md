# Pict Section Login

> **[&#9654; Read the Pict-Section-Login Documentation](https://stevenvelozo.github.io/pict-section-login/)** &mdash; interactive docs with the full API reference.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

A drop-in login section for Pict applications. Renders a styled login form, calls out to [orator-authentication](https://github.com/stevenvelozo/orator-authentication) (or any custom backend) for sign-in / sign-out / session-check, stores the resulting session on the Pict AppData tree, and exposes override hooks so you can chain navigation, route resolution, or any other post-auth behavior.

## Features

- **Drop-In View** -- Extends `pict-view`; register with `pict.addView(...)` and call `render()` to get a complete login form
- **Orator-Authentication Ready** -- Default endpoints match the standard `orator-authentication` routes; works out of the box
- **Custom Backend Friendly** -- Every endpoint is configurable, both POST (JSON body) and GET (URL-encoded credentials) are supported
- **Session Management** -- `login`, `logout`, and `checkSession` methods plus automatic check-on-load
- **OAuth Provider Support** -- Optional OAuth button row populated from `/OAuth/Providers` and redirected through `/OAuth/Begin`
- **AppData Integration** -- Session data is written to a configurable Pict manifest address (default `AppData.Session`)
- **Override Hooks** -- `onLoginSuccess`, `onLoginFailed`, `onLogout`, `onSessionChecked` for post-auth navigation and app state updates
- **Router Friendly** -- Designed to cooperate with [pict-router](https://github.com/stevenvelozo/pict-router) for route-guarded navigation and post-login redirects
- **Styled Out of the Box** -- Embedded CSS design system renders a polished card with no extra styling required

## Installation

```bash
npm install pict-section-login
```

## Quick Start

```javascript
const libPict = require('pict');
const libPictSectionLogin = require('pict-section-login');

class MyLoginView extends libPictSectionLogin
{
	onLoginSuccess(pSessionData)
	{
		this.log.info('Logged in as', pSessionData?.UserRecord?.LoginID);
		// e.g. this.pict.PictApplication.showProtectedApp();
	}
}

const _Pict = new libPict();
_Pict.addView(
	'MyLogin',
	{
		"ViewIdentifier": "MyLogin",
		"TargetElementAddress": "#Pict-Login-Container"
	},
	MyLoginView);

_Pict.views.MyLogin.render();
```

Drop a mount point into your page:

```html
<div id="Pict-Login-Container"></div>
```

That's the whole thing for a default orator-authentication wiring. See [docs/quickstart.md](docs/quickstart.md) for custom backends, OAuth, hooks, and AppData access.

## Configuration Overview

| Key | Default | Purpose |
|---|---|---|
| `LoginEndpoint` | `/1.0/Authenticate` | Endpoint to POST credentials to |
| `LoginMethod` | `POST` | `POST` (JSON body) or `GET` (URL-encoded) |
| `LogoutEndpoint` | `/1.0/Deauthenticate` | Endpoint to end the session |
| `CheckSessionEndpoint` | `/1.0/CheckSession` | Endpoint to validate an existing session |
| `OAuthProvidersEndpoint` | `/1.0/OAuth/Providers` | List of available OAuth providers |
| `OAuthBeginEndpoint` | `/1.0/OAuth/Begin` | OAuth redirect prefix |
| `CheckSessionOnLoad` | `true` | Auto-call `checkSession` on first render |
| `ShowOAuthProviders` | `false` | Render OAuth buttons alongside the form |
| `SessionDataAddress` | `AppData.Session` | Manifest address to store session data |
| `TargetElementAddress` | `#Pict-Login-Container` | CSS selector for the mount point |

See [docs/configuration.md](docs/configuration.md) for the full reference.

## Public API

| Method | Purpose |
|---|---|
| `login(pUsername, pPassword, fCallback)` | Authenticate with credentials |
| `logout(fCallback)` | End the current session |
| `checkSession(fCallback)` | Validate an existing session (e.g. from a cookie) |
| `loadOAuthProviders(fCallback)` | Fetch and render OAuth provider buttons |
| `onLoginSuccess(pSessionData)` | Override hook fired after successful login |
| `onLoginFailed(pError)` | Override hook fired after failed login |
| `onLogout()` | Override hook fired after logout |
| `onSessionChecked(pSessionData)` | Override hook fired after a session check |

See [docs/api-reference.md](docs/api-reference.md) and [docs/code-snippets.md](docs/code-snippets.md) for complete details and runnable examples.

## Router Integration

`pict-section-login` pairs naturally with [pict-router](https://github.com/stevenvelozo/pict-router): register your routes with `SkipRouteResolveOnAdd: true`, call `checkSession()` before resolving, and implement a `PendingRoute` redirect in `onLoginSuccess`. See [docs/router-integration.md](docs/router-integration.md) for the full pattern, including route guards and post-login redirects.

## Documentation

- [Overview](docs/README.md)
- [Quick Start](docs/quickstart.md)
- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [API Reference](docs/api-reference.md)
- [Code Snippets](docs/code-snippets.md)
- [Embedding Guide](docs/embedding-guide.md)
- [Router Integration](docs/router-integration.md)
- [Templates & Styling](docs/templates-and-styling.md)

## Example Applications

- [`example_applications/orator_login`](example_applications/orator_login) -- minimal orator-authentication wiring
- [`example_applications/custom_login`](example_applications/custom_login) -- custom endpoints + override hooks
- [`example_applications/oauth_login`](example_applications/oauth_login) -- OAuth provider list integration
- [`example_applications/harness_app`](example_applications/harness_app) -- full integration: login + pict-router + protected views + top bar

## Testing

```bash
npm test
npm run test-browser    # Puppeteer headless browser tests
npm run coverage
```

## Related Packages

- [pict](https://github.com/stevenvelozo/pict) -- MVC application framework
- [pict-view](https://github.com/stevenvelozo/pict-view) -- View base class
- [pict-router](https://github.com/stevenvelozo/pict-router) -- Hash-based router that pairs with this module
- [pict-application](https://github.com/stevenvelozo/pict-application) -- Application host and lifecycle
- [orator-authentication](https://github.com/stevenvelozo/orator-authentication) -- Default backend
- [fable](https://github.com/stevenvelozo/fable) -- Core service ecosystem

## License

MIT

## Contributing

Pull requests welcome. See the [Retold Contributing Guide](https://github.com/stevenvelozo/retold/blob/main/docs/contributing.md) for the code of conduct, contribution process, and testing requirements.
