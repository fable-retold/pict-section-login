# Templates & Styling

`pict-section-login` ships with five templates and an embedded CSS design system. All six pieces are configurable and can be replaced individually or in bulk.

## Default Templates

Every template is registered with the Pict `TemplateProvider` using the hashes below. To override one, pass a `Templates` array in your options that replaces (or appends to) the shipped defaults.

### `Pict-Login-Template-Wrapper`

The outer card that contains the error strip, form area, OAuth area, and status area. The view switches visibility on these inner divs depending on whether the user is authenticated.

```html
<div class="pict-login-card">
	<div id="pict-login-error" class="pict-login-error" style="display:none"></div>
	<div id="pict-login-form-area"></div>
	<div id="pict-login-oauth-area"></div>
	<div id="pict-login-status-area" style="display:none"></div>
</div>
```

Required child ids (the view writes into these selectors):

- `#pict-login-error` -- error message container
- `#pict-login-form-area` -- login form container
- `#pict-login-oauth-area` -- OAuth button row container
- `#pict-login-status-area` -- logged-in status bar container

Override the wrapper only if you need different outer markup. If you only want a different visual style, override the CSS instead.

### `Pict-Login-Template-Form`

The username / password form. The view wires up the submit handler based on the form id.

```html
<form id="pict-login-form" class="pict-login-form">
	<label class="pict-login-label" for="pict-login-username">Username</label>
	<input class="pict-login-input" type="text" id="pict-login-username" name="username" autocomplete="username" required />

	<label class="pict-login-label" for="pict-login-password">Password</label>
	<input class="pict-login-input" type="password" id="pict-login-password" name="password" autocomplete="current-password" required />

	<button class="pict-login-submit" type="submit">Log In</button>
</form>
```

Required ids:

- `#pict-login-form` -- the `submit` handler is bound here
- `#pict-login-username` -- value is read as the username
- `#pict-login-password` -- value is read as the password

### `Pict-Login-Template-Status`

The logged-in status bar that replaces the form when `authenticated === true`.

```html
<div class="pict-login-status">
	<span class="pict-login-dot pict-login-dot--on"></span>
	<span class="pict-login-user-label">Logged in as <strong id="pict-login-display-name"></strong></span>
	<span class="pict-login-user-id" id="pict-login-display-id"></span>
	<button class="pict-login-logout-btn" id="pict-login-logout" type="button">Log out</button>
</div>
```

Required ids:

- `#pict-login-display-name` -- `innerText` is set to `sessionData.UserRecord?.FullName`
- `#pict-login-display-id` -- `innerText` is set to `sessionData.UserID`
- `#pict-login-logout` -- the `click` handler is bound here

### `Pict-Login-Template-OAuthProviders`

The OAuth button row. Rendered only when `ShowOAuthProviders === true` and the provider endpoint returns a non-empty list.

```html
<div class="pict-login-oauth">
	<div class="pict-login-oauth-divider"><span>or sign in with</span></div>
	<div class="pict-login-oauth-buttons" id="pict-login-oauth-buttons"></div>
</div>
```

Required ids:

- `#pict-login-oauth-buttons` -- the view writes one button per provider into this container

### `Pict-Login-Template-Error`

The inline error strip shown after a failed login or a failed network request. The view parses it with the current error message available at `Record.Message`.

```html
<div class="pict-login-error-message">{~D:Record.Message~}</div>
```

## Replacing One Template

To replace a single template while keeping the others, spread the defaults and override by hash:

```javascript
const libPictSectionLogin = require('pict-section-login');
const tmpDefaults = libPictSectionLogin.default_configuration;

const tmpCustomForm =
{
	"Hash": "Pict-Login-Template-Form",
	"Template": `
		<form id="pict-login-form" class="my-form">
			<div class="my-field">
				<label for="pict-login-username">Email address</label>
				<input id="pict-login-username" name="username" type="email" autocomplete="username" required />
			</div>
			<div class="my-field">
				<label for="pict-login-password">Password</label>
				<input id="pict-login-password" name="password" type="password" autocomplete="current-password" required />
			</div>
			<button type="submit" class="my-button">Sign In</button>
		</form>
	`
};

const tmpOptions =
{
	"ViewIdentifier": "MyLogin",
	"Templates":
	[
		...tmpDefaults.Templates.filter(t => t.Hash !== 'Pict-Login-Template-Form'),
		tmpCustomForm
	]
};
```

Keep the required element ids (`pict-login-form`, `pict-login-username`, `pict-login-password`) or the view's event wiring will not find them.

## Adding a Template

You can also add new templates and reference them from a replacement wrapper:

```javascript
const tmpOptions =
{
	"ViewIdentifier": "MyLogin",
	"Templates":
	[
		...tmpDefaults.Templates,
		{
			"Hash": "MyLogin-Footer",
			"Template": "<div class=\"my-login-footer\">Powered by Example Inc.</div>"
		},
		{
			"Hash": "Pict-Login-Template-Wrapper",
			"Template": `
				<div class="pict-login-card">
					<div id="pict-login-error" class="pict-login-error" style="display:none"></div>
					<div id="pict-login-form-area"></div>
					<div id="pict-login-oauth-area"></div>
					<div id="pict-login-status-area" style="display:none"></div>
					<div class="my-login-footer-slot">{~T:MyLogin-Footer~}</div>
				</div>
			`
		}
	]
};
```

Pict template expressions (`{~T:...~}`, `{~D:...~}`, `{~LV:...~}`) work everywhere inside a template; see the [pict-template](https://github.com/fable-retold/pict-template) documentation for the full expression language.

## Embedded CSS

The view injects a self-contained design system via `options.CSS`. The class names cover the entire rendered surface:

| Class | Applies To |
|---|---|
| `.pict-login-card` | outer card container |
| `.pict-login-error` | error strip wrapper |
| `.pict-login-error-message` | error text inside the strip |
| `.pict-login-form` | login form element |
| `.pict-login-label` | field labels |
| `.pict-login-input` | username / password inputs |
| `.pict-login-submit` | submit button |
| `.pict-login-status` | logged-in status bar |
| `.pict-login-dot` / `.pict-login-dot--on` | session indicator |
| `.pict-login-user-label`, `.pict-login-user-id` | status bar text |
| `.pict-login-logout-btn` | logout button |
| `.pict-login-oauth` | OAuth row wrapper |
| `.pict-login-oauth-divider` | "or sign in with" divider |
| `.pict-login-oauth-buttons` | button container |
| Provider-specific modifiers | Google, Microsoft, etc. |

The CSS is injected with `this.pict.CSSMap.injectCSS()` on first render, which appends it to any `<style id="PICT-CSS">` tag on the page (the Pict convention). You do not need to import a separate stylesheet.

## Restyling Without Replacing the CSS

The simplest way to restyle the view is to add your own rules on top of the shipped ones. Pict's CSSMap injection happens before your page styles if you include your stylesheet after the Pict loader, so your rules win.

```css
/* in your app stylesheet, loaded after pict.js */
.pict-login-card
{
	background: #0b1220;
	color: #e6edf7;
	border: 1px solid #1f2a44;
}
.pict-login-input
{
	background: #0f1a30;
	border-color: #22304f;
	color: #e6edf7;
}
.pict-login-submit
{
	background: #6366f1;
}
```

## Replacing the CSS Entirely

To replace the shipped CSS instead of layering over it, pass your own `CSS` string in the options:

```javascript
const tmpOptions =
{
	"ViewIdentifier": "MyLogin",
	"CSS": `
		.pict-login-card { /* your rules */ }
		.pict-login-form { /* your rules */ }
		/* ... */
	`
};
```

If you do this, you are responsible for styling every `.pict-login-*` class that the default templates reference. The easiest starting point is to copy the embedded CSS from `source/Pict-Section-Login-DefaultConfiguration.js` and modify it in place.

## Disabling the Built-In CSS

There is no explicit flag to disable the injected CSS, but you can pass `CSS: ""` to inject an empty string:

```javascript
const tmpOptions =
{
	"ViewIdentifier": "MyLogin",
	"CSS": ""
};
```

Pair this with your own global stylesheet that targets the `.pict-login-*` classes.

## Localization

The view does not ship with an i18n layer. To localize:

- Replace `Pict-Login-Template-Form`, `Pict-Login-Template-Status`, and `Pict-Login-Template-OAuthProviders` with translated versions.
- If your Pict application uses a central phrase provider, reference it from the templates with the usual `{~D:...~}` or `{~LV:...~}` expressions.
- Localize error messages in `onLoginFailed()` (e.g. map backend error codes to localized strings before logging or displaying).

## Template Solver Expressions

Every template is parsed by Pict's template engine on render, so you can use any template expression inside a template you replace. The most common ones:

| Expression | Purpose |
|---|---|
| `{~D:AppData.Session.UserRecord.FullName~}` | read a value from the manifest |
| `{~T:Template-Hash~}` | include another template by hash |
| `{~LV:jsExpression~}` | evaluate a JS expression against the app context |

See [pict-template](https://github.com/fable-retold/pict-template) for the full expression reference.
