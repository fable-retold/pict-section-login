# Embedding Guide

This guide walks through embedding `pict-section-login` into a real Pict application with a login screen and protected content. It covers three common layouts: standalone login page, login-before-shell, and login-as-modal.

All examples assume a host Pict application that extends `pict-application`. If you are starting from scratch, see [pict-application](https://github.com/fable-retold/pict-application) first.

## Layout A: Standalone Login Page

The simplest embedding. The page contains only the login view; the browser navigates to a different URL after a successful sign-in. Suitable for server-rendered sites that just need a standalone sign-in page.

### HTML

```html
<!doctype html>
<html>
<head>
	<title>Sign In</title>
	<style id="PICT-CSS"></style>
	<script src="./pict.js"></script>
</head>
<body>
	<div class="page-center">
		<h1>Sign In</h1>
		<div id="Pict-Login-Container"></div>
	</div>

	<script src="./my-app.js"></script>
	<script>
		Pict.safeOnDocumentReady(() => Pict.safeLoadPictApplication(MyLoginApp, 1));
	</script>
</body>
</html>
```

### Application

```javascript
const libPictApplication  = require('pict-application');
const libPictSectionLogin = require('pict-section-login');

class MyLoginView extends libPictSectionLogin
{
	onLoginSuccess(pSessionData)
	{
		// Hard redirect to the main application
		window.location.href = '/app/';
	}
}

class MyLoginApp extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.pict.addView(
			'MyLogin',
			{
				"ViewIdentifier":       "MyLogin",
				"TargetElementAddress": "#Pict-Login-Container"
			},
			MyLoginView);
	}

	onAfterInitialize()
	{
		this.pict.views.MyLogin.render();
	}
}

module.exports = MyLoginApp;
```

## Layout B: Login-Before-Shell (Recommended)

The same single-page application hosts both the login view and the protected shell. This is the pattern the `harness_app` example demonstrates and the one most real applications end up using.

### HTML

Two mount points: one for the login container and one for the protected shell. Hide the shell until authenticated.

```html
<!doctype html>
<html>
<head>
	<title>Bookstore</title>
	<style id="PICT-CSS"></style>
	<script src="./pict.js"></script>
</head>
<body>
	<div id="HarnessApp-Login-Container">
		<h1>Bookstore</h1>
		<div id="Pict-Login-Container"></div>
	</div>

	<div id="HarnessApp-Container" style="display:none"></div>

	<script src="./harness_app.js"></script>
	<script>
		Pict.safeOnDocumentReady(() => Pict.safeLoadPictApplication(HarnessApp, 1));
	</script>
</body>
</html>
```

### Login View Subclass

Override `onLoginSuccess` and `onSessionChecked` to switch to the protected shell. Override `onLogout` (or handle it at the application level) to switch back.

```javascript
const libPictSectionLogin = require('pict-section-login');

class HarnessAppLoginView extends libPictSectionLogin
{
	onLoginSuccess(pSessionData)
	{
		this.log.info('Login succeeded, switching to protected app.');
		this.pict.PictApplication?.showProtectedApp?.();
	}

	onSessionChecked(pSessionData)
	{
		if (pSessionData && pSessionData.LoggedIn)
		{
			this.log.info('Existing session found, switching to protected app.');
			this.pict.PictApplication?.showProtectedApp?.();
		}
	}
}

module.exports = HarnessAppLoginView;
module.exports.default_configuration =
{
	"ViewIdentifier":       "HarnessApp-Login",
	"TargetElementAddress": "#HarnessApp-Login-Container",
	"CheckSessionOnLoad":   false,    // the application decides when to check
	"LoginEndpoint":        "/1.0/Authenticate",
	"LogoutEndpoint":       "/1.0/Deauthenticate",
	"CheckSessionEndpoint": "/1.0/CheckSession",
	"SessionDataAddress":   "AppData.Session"
};
```

### Application

```javascript
const libPictApplication = require('pict-application');
const HarnessAppLoginView = require('./views/HarnessAppLoginView');

class HarnessApp extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.pict.addView(
			'HarnessApp-Login',
			HarnessAppLoginView.default_configuration,
			HarnessAppLoginView);

		// Register the rest of the application's views here...
	}

	onAfterInitializeAsync(fCallback)
	{
		// 1. Render the login form
		this.pict.views['HarnessApp-Login'].render();
		this.pict.CSSMap.injectCSS();

		// 2. Check for an existing session. The onSessionChecked() hook
		//    on the login view decides whether to show the protected shell.
		this.pict.views['HarnessApp-Login'].checkSession();

		if (fCallback) fCallback();
	}

	showProtectedApp()
	{
		// Hide the login container
		document.getElementById('HarnessApp-Login-Container').style.display = 'none';

		// Show the protected shell
		document.getElementById('HarnessApp-Container').style.display = '';

		// Render the shell view (top bar, sidebar, content area)
		this.pict.views['HarnessApp-Layout'].render();
	}

	showLogin()
	{
		// Hide the protected shell
		document.getElementById('HarnessApp-Container').style.display = 'none';

		// Show and reset the login container
		document.getElementById('HarnessApp-Login-Container').style.display = '';
		this.pict.views['HarnessApp-Login'].render();
	}

	doLogout()
	{
		this.pict.views['HarnessApp-Login'].logout(() => this.showLogin());
	}
}

module.exports = HarnessApp;
```

### Why `CheckSessionOnLoad: false`?

In Layout B the application controls the timing of the session check so it can react to the result *after* the protected shell's providers and views are registered. If you leave `CheckSessionOnLoad: true`, the check races with the rest of the application's initialization and you may end up calling `showProtectedApp` before the shell is ready.

## Layout C: Login As a Modal

Render the protected shell immediately; overlay a login modal when the session is missing.

### HTML

```html
<div id="app-shell"></div>

<div id="login-modal" class="login-modal" style="display:none">
	<div class="login-modal-backdrop"></div>
	<div class="login-modal-box">
		<h2>Sign In</h2>
		<div id="Pict-Login-Container"></div>
	</div>
</div>
```

### View + Application

```javascript
class ModalLoginView extends libPictSectionLogin
{
	onLoginSuccess(pSessionData)
	{
		// Hide the modal
		document.getElementById('login-modal').style.display = 'none';

		// Resume any pending action that triggered the modal
		const tmpPending = this.pict.AppData.PendingAction;
		if (typeof tmpPending === 'function')
		{
			this.pict.AppData.PendingAction = null;
			tmpPending();
		}
	}
}

class ModalLoginApp extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.pict.addView(
			'ModalLogin',
			{
				"ViewIdentifier":       "ModalLogin",
				"TargetElementAddress": "#Pict-Login-Container",
				"CheckSessionOnLoad":   false
			},
			ModalLoginView);
	}

	requireAuth(fPendingAction)
	{
		if (this.pict.AppData.Session?.LoggedIn)
		{
			fPendingAction();
			return;
		}
		this.pict.AppData.PendingAction = fPendingAction;
		document.getElementById('login-modal').style.display = '';
		this.pict.views.ModalLogin.render();
	}
}
```

Any protected operation in your app then wraps itself with `requireAuth`:

```javascript
openBook(pBookId)
{
	this.requireAuth(() =>
	{
		// actually open the book
	});
}
```

## Best Practices

- **One login view per application.** The login view owns its own state (`authenticated`, `sessionData`); embedding multiple instances simultaneously is possible but rarely useful.
- **Use `SessionDataAddress` consistently.** Pick one address (`AppData.Session` is the default) and read it from everywhere. Templates, views, route handlers, and other services should all refer to the same key.
- **Let `logout()` clean up.** Do not manually null out `authenticated` or `sessionData`. Call `logout()` and let it run its cleanup path, which also writes `null` to the manifest address and invokes `onLogout()`.
- **Treat `checkSession()` as the source of truth.** On page load, run `checkSession()` before rendering anything that depends on the session. This is what makes "already logged in" work seamlessly after a browser refresh.
- **Do not mix `CheckSessionOnLoad: true` with application-driven checks.** Pick one: either let the view check on load, or set `CheckSessionOnLoad: false` and call `checkSession()` from the application. Doing both causes two simultaneous requests.
- **Surface `onLoginFailed()` prominently.** The default template shows a small error strip; add analytics or a toast for better visibility if your backend enforces lockout or 2FA.
- **Keep the backend stateful.** The view does not store tokens. If your backend issues JWTs that the client must remember, you will need to add a minimal service (outside this view) that handles the token lifecycle; for cookie-based sessions no extra work is needed.
- **Version your session shape.** The view treats `sessionData` as opaque except for `LoggedIn`, `UserID`, and `UserRecord.FullName` / `UserRecord.LoginID`. Add any other fields your app needs; they survive unchanged.
- **Avoid racing the router.** If you are using `pict-router`, set `SkipRouteResolveOnAdd: true` on the router config and call `resolve()` only after the session check has landed. See [Router Integration](router-integration.md).

## Common Pitfalls

| Problem | Cause | Fix |
|---|---|---|
| Login form renders briefly, then disappears on load | `CheckSessionOnLoad: true` restored an existing session | Expected; override `onSessionChecked` and show a "restoring session" state if the flash is objectionable |
| Protected shell renders before `checkSession()` finishes | Rendering the shell unconditionally in `onAfterInitialize` | Render it only from `onSessionChecked` / `onLoginSuccess` |
| Logging out in one tab leaves the other tab logged in | No cross-tab coordination | Call `checkSession()` on `window.focus` or add a BroadcastChannel |
| Multiple login views fighting over `#Pict-Login-Container` | More than one view registered with the same `TargetElementAddress` | Give each view its own container |
| `onSessionChecked` fires with `null` every time | Network failure or CORS blocking the check endpoint | Inspect the network panel; fix CORS / endpoint URL |
