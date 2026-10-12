const libPictViewClass = require('pict-view');
const _DefaultConfiguration = require('./Pict-Section-Login-DefaultConfiguration.js');

class PictSectionLogin extends libPictViewClass
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, _DefaultConfiguration, pOptions);
		super(pFable, tmpOptions, pServiceHash);

		// --- State ---
		this.authenticated = false;
		this.sessionData = null;
		this.oauthProviders = [];
		this.magicLinkMode = false;

		this.initialRenderComplete = false;
	}

	// ===== Lifecycle Hooks =====

	onBeforeInitialize()
	{
		return super.onBeforeInitialize();
	}

	onAfterRender(pRenderable)
	{
		// Inject all registered CSS into the DOM
		this.pict.CSSMap.injectCSS();

		if (!this.initialRenderComplete)
		{
			this.onAfterInitialRender();
			this.initialRenderComplete = true;
		}

		return super.onAfterRender(pRenderable);
	}

	onAfterInitialRender()
	{
		// Populate the form (or status) into the wrapper placeholders
		this._updateView();

		if (this.options.CheckSessionOnLoad)
		{
			this.checkSession();
		}

		if (this.options.ShowOAuthProviders)
		{
			this.loadOAuthProviders();
		}
	}

	// ===== Public API =====

	/**
	 * Authenticate with username and password.
	 *
	 * @param {string} pUsername - The username / login ID
	 * @param {string} pPassword - The password
	 * @param {function} [fCallback] - Optional callback(pError, pSessionData)
	 */
	login(pUsername, pPassword, fCallback)
	{
		if (typeof (fCallback) !== 'function')
		{
			fCallback = () => {};
		}

		this._clearError();

		let tmpFetchOptions = {};
		let tmpURL = this.options.LoginEndpoint;

		if (this.options.LoginMethod === 'GET')
		{
			tmpURL = tmpURL + '/' + encodeURIComponent(pUsername) + '/' + encodeURIComponent(pPassword);
			tmpFetchOptions.method = 'GET';
		}
		else
		{
			tmpFetchOptions.method = 'POST';
			tmpFetchOptions.headers = { 'Content-Type': 'application/json' };
			tmpFetchOptions.body = JSON.stringify({ UserName: pUsername, Password: pPassword });
		}

		fetch(tmpURL, tmpFetchOptions)
			.then((pResponse) =>
			{
				return pResponse.json();
			})
			.then((pData) =>
			{
				if (pData && pData.LoggedIn)
				{
					this.authenticated = true;
					this.sessionData = pData;
					this._storeSessionData(pData);
					this._updateView();
					this.onLoginSuccess(pData);
					this._solveApp();
					return fCallback(null, pData);
				}
				else
				{
					let tmpError = (pData && pData.Error) ? pData.Error : 'Authentication failed.';
					this._displayError(tmpError);
					this.onLoginFailed(tmpError);
					return fCallback(tmpError);
				}
			})
			.catch((pError) =>
			{
				let tmpMessage = 'Login request failed.';
				this.log.error('PictSectionLogin login error: ' + pError.message);
				this._displayError(tmpMessage);
				this.onLoginFailed(tmpMessage);
				return fCallback(tmpMessage);
			});
	}

	/**
	 * End the current session.
	 *
	 * @param {function} [fCallback] - Optional callback(pError)
	 */
	logout(fCallback)
	{
		if (typeof (fCallback) !== 'function')
		{
			fCallback = () => {};
		}

		fetch(this.options.LogoutEndpoint)
			.then((pResponse) =>
			{
				return pResponse.json();
			})
			.then(() =>
			{
				this.authenticated = false;
				this.sessionData = null;
				this._storeSessionData(null);
				this._updateView();
				this.onLogout();
				this._solveApp();
				return fCallback(null);
			})
			.catch((pError) =>
			{
				this.log.error('PictSectionLogin logout error: ' + pError.message);
				// Clear local state even if network failed
				this.authenticated = false;
				this.sessionData = null;
				this._storeSessionData(null);
				this._updateView();
				this.onLogout();
				this._solveApp();
				return fCallback(pError.message);
			});
	}

	/**
	 * Check whether an existing session is active (e.g. from a cookie).
	 *
	 * @param {function} [fCallback] - Optional callback(pError, pSessionData)
	 */
	checkSession(fCallback)
	{
		if (typeof (fCallback) !== 'function')
		{
			fCallback = () => {};
		}

		fetch(this.options.CheckSessionEndpoint)
			.then((pResponse) =>
			{
				return pResponse.json();
			})
			.then((pData) =>
			{
				if (pData && pData.LoggedIn)
				{
					this.authenticated = true;
					this.sessionData = pData;
					this._storeSessionData(pData);
					this._updateView();
				}
				this.onSessionChecked(pData);
				this._solveApp();
				return fCallback(null, pData);
			})
			.catch((pError) =>
			{
				this.log.error('PictSectionLogin checkSession error: ' + pError.message);
				this.onSessionChecked(null);
				return fCallback(pError.message);
			});
	}

	/**
	 * Fetch available OAuth providers and render buttons.
	 *
	 * @param {function} [fCallback] - Optional callback(pError, pProviders)
	 */
	loadOAuthProviders(fCallback)
	{
		if (typeof (fCallback) !== 'function')
		{
			fCallback = () => {};
		}

		fetch(this.options.OAuthProvidersEndpoint)
			.then((pResponse) =>
			{
				return pResponse.json();
			})
			.then((pData) =>
			{
				if (pData && Array.isArray(pData.Providers))
				{
					this.oauthProviders = pData.Providers;
					this._renderOAuthButtons();
				}
				return fCallback(null, this.oauthProviders);
			})
			.catch((pError) =>
			{
				this.log.warn('PictSectionLogin loadOAuthProviders: ' + pError.message);
				return fCallback(pError.message);
			});
	}

	// ===== Magic Link (passwordless) =====

	/**
	 * Request a one-time sign-in link by email. The backend is anti-enumeration (it always reports
	 * success), so the UI always shows the neutral "check your email" state and never reveals whether
	 * an account exists.
	 *
	 * @param {string} pEmail - The email address to send the link to
	 * @param {function} [fCallback] - Optional callback(pError, pData)
	 */
	requestMagicLink(pEmail, fCallback)
	{
		if (typeof (fCallback) !== 'function') { fCallback = () => {}; }
		this._clearError();

		fetch(this.options.MagicLinkRequestEndpoint,
			{ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Email: pEmail }) })
			.then((pResponse) => pResponse.json())
			.then((pData) =>
			{
				this._showMagicSent();
				this.onMagicLinkSent(pData || {});
				return fCallback(null, pData);
			})
			.catch((pError) =>
			{
				this.log.error('PictSectionLogin requestMagicLink error: ' + pError.message);
				this._displayError('Could not request a sign-in link.');
				return fCallback(pError.message);
			});
	}

	/**
	 * Verify a magic-link token (from the clicked link's route) and sign in. On a 2FA account the
	 * server returns a challenge envelope instead of a session; that is handed to onMagicLinkChallenge
	 * so the host can run its second-factor step.
	 *
	 * @param {string} pToken - The one-time token carried by the link
	 * @param {function} [fCallback] - Optional callback(pError, pData)
	 */
	verifyMagicLink(pToken, fCallback)
	{
		if (typeof (fCallback) !== 'function') { fCallback = () => {}; }
		this._clearError();

		fetch(this.options.MagicLinkVerifyEndpoint,
			{ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Token: pToken }) })
			.then((pResponse) => pResponse.json())
			.then((pData) =>
			{
				if (pData && pData.LoggedIn)
				{
					this.authenticated = true;
					this.sessionData = pData;
					this._storeSessionData(pData);
					this._updateView();
					this.onLoginSuccess(pData);
					this._solveApp();
					return fCallback(null, pData);
				}
				if (pData && pData.Challenge)
				{
					this.onMagicLinkChallenge(pData);
					return fCallback(null, pData);
				}
				let tmpError = (pData && pData.Error) ? pData.Error : 'This sign-in link is no longer valid.';
				this._displayError(tmpError);
				this.onLoginFailed(tmpError);
				return fCallback(tmpError);
			})
			.catch((pError) =>
			{
				this.log.error('PictSectionLogin verifyMagicLink error: ' + pError.message);
				let tmpMessage = 'Could not verify the sign-in link.';
				this._displayError(tmpMessage);
				this.onLoginFailed(tmpMessage);
				return fCallback(tmpMessage);
			});
	}

	/**
	 * Switch the card to the magic-link (email) form.
	 */
	showMagicLinkForm()
	{
		this.magicLinkMode = true;
		this._clearError();
		let tmpAreaElements = this.services.ContentAssignment.getElement('#pict-login-form-area');
		if (tmpAreaElements && tmpAreaElements.length > 0) { this._renderFormArea(tmpAreaElements[0]); }
	}

	/**
	 * Switch the card back to the password form.
	 */
	showPasswordForm()
	{
		this.magicLinkMode = false;
		this._clearError();
		let tmpAreaElements = this.services.ContentAssignment.getElement('#pict-login-form-area');
		if (tmpAreaElements && tmpAreaElements.length > 0) { this._renderFormArea(tmpAreaElements[0]); }
	}

	// ===== Overridable Hooks =====
	// Developers override these for custom post-login/logout behavior.

	/**
	 * Called after a successful login.
	 * @param {object} pSessionData - The session data from the server
	 */
	onLoginSuccess(pSessionData)
	{
		// Override in subclass or instance
	}

	/**
	 * Called after a failed login attempt.
	 * @param {string} pError - The error message
	 */
	onLoginFailed(pError)
	{
		// Override in subclass or instance
	}

	/**
	 * Called after a successful logout.
	 */
	onLogout()
	{
		// Override in subclass or instance
	}

	/**
	 * Called after a session check completes.
	 * @param {object|null} pSessionData - The session data, or null on error
	 */
	onSessionChecked(pSessionData)
	{
		// Override in subclass or instance
	}

	/**
	 * Called after a magic-link request was sent (the neutral "check your email" state is already shown).
	 * @param {object} pData - The server response
	 */
	onMagicLinkSent(pData)
	{
		// Override in subclass or instance
	}

	/**
	 * Called when verifying a magic link returns a second-factor challenge instead of a session.
	 * The host runs its 2FA step with the challenge envelope (ChallengeToken, Channel, ...).
	 * @param {object} pChallenge - The challenge envelope from the server
	 */
	onMagicLinkChallenge(pChallenge)
	{
		// Override in subclass or instance
	}

	// ===== Internal Helpers =====

	/**
	 * Wire up DOM event handlers on the login form and logout button.
	 */
	_wireFormEvents()
	{
		let tmpFormElements = this.services.ContentAssignment.getElement('#pict-login-form');
		if (tmpFormElements && tmpFormElements.length > 0)
		{
			let tmpForm = tmpFormElements[0];
			tmpForm.addEventListener('submit', (pEvent) =>
			{
				pEvent.preventDefault();
				let tmpUsernameInput = tmpForm.querySelector('#pict-login-username');
				let tmpPasswordInput = tmpForm.querySelector('#pict-login-password');

				let tmpUsername = tmpUsernameInput ? tmpUsernameInput.value : '';
				let tmpPassword = tmpPasswordInput ? tmpPasswordInput.value : '';

				if (!tmpUsername)
				{
					this._displayError('Please enter a username.');
					return;
				}

				this.login(tmpUsername, tmpPassword);
			});
		}

		let tmpShowMagicElements = this.services.ContentAssignment.getElement('#pict-login-show-magic');
		if (tmpShowMagicElements && tmpShowMagicElements.length > 0)
		{
			tmpShowMagicElements[0].addEventListener('click', () =>
			{
				this.showMagicLinkForm();
			});
		}

		let tmpLogoutElements = this.services.ContentAssignment.getElement('#pict-login-logout');
		if (tmpLogoutElements && tmpLogoutElements.length > 0)
		{
			tmpLogoutElements[0].addEventListener('click', () =>
			{
				this.logout();
			});
		}
	}

	/**
	 * Render the password form (plus the magic-link toggle when ShowMagicLink is set) or the magic-link
	 * form into the form area, then wire its events. Mode is driven by this.magicLinkMode.
	 */
	_renderFormArea(pFormArea)
	{
		if (this.magicLinkMode)
		{
			pFormArea.innerHTML = this.pict.parseTemplateByHash('Pict-Login-Template-MagicForm', {});
			this._wireMagicEvents();
			return;
		}
		let tmpHTML = this.pict.parseTemplateByHash('Pict-Login-Template-Form', {});
		if (this.options.ShowMagicLink)
		{
			tmpHTML += this.pict.parseTemplateByHash('Pict-Login-Template-MagicToggle', {});
		}
		pFormArea.innerHTML = tmpHTML;
		this._wireFormEvents();
	}

	/**
	 * Wire the magic-link form submit and its "use a password instead" toggle.
	 */
	_wireMagicEvents()
	{
		let tmpFormElements = this.services.ContentAssignment.getElement('#pict-login-magic-form');
		if (tmpFormElements && tmpFormElements.length > 0)
		{
			let tmpForm = tmpFormElements[0];
			tmpForm.addEventListener('submit', (pEvent) =>
			{
				pEvent.preventDefault();
				let tmpEmailInput = tmpForm.querySelector('#pict-login-magic-email');
				let tmpEmail = tmpEmailInput ? String(tmpEmailInput.value || '').trim() : '';
				if (!tmpEmail || tmpEmail.indexOf('@') < 1)
				{
					this._displayError('Please enter a valid email.');
					return;
				}
				this.requestMagicLink(tmpEmail);
			});

			let tmpBack = tmpForm.querySelector('#pict-login-show-password');
			if (tmpBack)
			{
				tmpBack.addEventListener('click', () =>
				{
					this.showPasswordForm();
				});
			}
		}
	}

	/**
	 * Replace the form area with the neutral "check your email" state.
	 */
	_showMagicSent()
	{
		let tmpAreaElements = this.services.ContentAssignment.getElement('#pict-login-form-area');
		if (!tmpAreaElements || tmpAreaElements.length < 1) { return; }
		let tmpArea = tmpAreaElements[0];
		tmpArea.innerHTML = this.pict.parseTemplateByHash('Pict-Login-Template-MagicSent', {});
		let tmpAgain = tmpArea.querySelector('#pict-login-magic-again');
		if (tmpAgain)
		{
			tmpAgain.addEventListener('click', () =>
			{
				this.showMagicLinkForm();
			});
		}
	}

	/**
	 * Show an error message in the error area.
	 * @param {string} pMessage - The error text
	 */
	_displayError(pMessage)
	{
		let tmpErrorElements = this.services.ContentAssignment.getElement('#pict-login-error');
		if (tmpErrorElements && tmpErrorElements.length > 0)
		{
			let tmpErrorEl = tmpErrorElements[0];
			tmpErrorEl.textContent = pMessage;
			tmpErrorEl.style.display = 'block';
		}
	}

	/**
	 * Hide the error area.
	 */
	_clearError()
	{
		let tmpErrorElements = this.services.ContentAssignment.getElement('#pict-login-error');
		if (tmpErrorElements && tmpErrorElements.length > 0)
		{
			let tmpErrorEl = tmpErrorElements[0];
			tmpErrorEl.textContent = '';
			tmpErrorEl.style.display = 'none';
		}
	}

	/**
	 * Re-render the view to reflect current authentication state.
	 * Shows the login form when unauthenticated, or the status bar when authenticated.
	 */
	_updateView()
	{
		let tmpFormAreaElements = this.services.ContentAssignment.getElement('#pict-login-form-area');
		let tmpStatusAreaElements = this.services.ContentAssignment.getElement('#pict-login-status-area');
		let tmpOAuthAreaElements = this.services.ContentAssignment.getElement('#pict-login-oauth-area');

		if (this.authenticated && this.sessionData)
		{
			// --- Authenticated: show status, hide form ---
			if (tmpFormAreaElements && tmpFormAreaElements.length > 0)
			{
				tmpFormAreaElements[0].style.display = 'none';
			}
			if (tmpOAuthAreaElements && tmpOAuthAreaElements.length > 0)
			{
				tmpOAuthAreaElements[0].style.display = 'none';
			}
			if (tmpStatusAreaElements && tmpStatusAreaElements.length > 0)
			{
				let tmpStatusArea = tmpStatusAreaElements[0];
				tmpStatusArea.style.display = 'block';

				// Render the status template
				let tmpStatusHTML = this.pict.parseTemplateByHash('Pict-Login-Template-Status', {});
				tmpStatusArea.innerHTML = tmpStatusHTML;

				// Populate display values
				let tmpDisplayName = '';
				let tmpDisplayID = '';

				if (this.sessionData.UserRecord)
				{
					tmpDisplayName = this.sessionData.UserRecord.FullName
						|| this.sessionData.UserRecord.LoginID
						|| this.sessionData.UserRecord.Email
						|| '';
					tmpDisplayID = this.sessionData.UserRecord.IDUser || this.sessionData.UserID || '';
				}
				else if (this.sessionData.UserID)
				{
					tmpDisplayID = this.sessionData.UserID;
				}

				let tmpNameElements = tmpStatusArea.querySelectorAll('#pict-login-display-name');
				if (tmpNameElements.length > 0)
				{
					tmpNameElements[0].textContent = tmpDisplayName;
				}

				let tmpIDElements = tmpStatusArea.querySelectorAll('#pict-login-display-id');
				if (tmpIDElements.length > 0)
				{
					if (tmpDisplayID)
					{
						tmpIDElements[0].textContent = 'ID ' + tmpDisplayID;
					}
					else
					{
						tmpIDElements[0].style.display = 'none';
					}
				}

				// Wire logout button
				let tmpLogoutBtn = tmpStatusArea.querySelector('#pict-login-logout');
				if (tmpLogoutBtn)
				{
					tmpLogoutBtn.addEventListener('click', () =>
					{
						this.logout();
					});
				}
			}
			this._clearError();
		}
		else
		{
			// --- Unauthenticated: show form, hide status ---
			if (tmpStatusAreaElements && tmpStatusAreaElements.length > 0)
			{
				tmpStatusAreaElements[0].style.display = 'none';
				tmpStatusAreaElements[0].innerHTML = '';
			}
			if (tmpFormAreaElements && tmpFormAreaElements.length > 0)
			{
				let tmpFormArea = tmpFormAreaElements[0];
				tmpFormArea.style.display = 'block';

				// Re-render the form (password or magic-link) if nothing is rendered yet.
				if (!tmpFormArea.querySelector('#pict-login-form')
					&& !tmpFormArea.querySelector('#pict-login-magic-form')
					&& !tmpFormArea.querySelector('.pict-login-sent'))
				{
					this._renderFormArea(tmpFormArea);
				}
			}
			if (tmpOAuthAreaElements && tmpOAuthAreaElements.length > 0)
			{
				if (this.options.ShowOAuthProviders && this.oauthProviders.length > 0)
				{
					tmpOAuthAreaElements[0].style.display = 'block';
				}
				else
				{
					tmpOAuthAreaElements[0].style.display = 'none';
				}
			}
		}
	}

	/**
	 * Render OAuth provider buttons into the OAuth area.
	 */
	_renderOAuthButtons()
	{
		let tmpOAuthAreaElements = this.services.ContentAssignment.getElement('#pict-login-oauth-area');
		if (!tmpOAuthAreaElements || tmpOAuthAreaElements.length < 1)
		{
			return;
		}

		if (!this.oauthProviders || this.oauthProviders.length < 1)
		{
			tmpOAuthAreaElements[0].style.display = 'none';
			return;
		}

		// Render the OAuth container template
		let tmpOAuthHTML = this.pict.parseTemplateByHash('Pict-Login-Template-OAuthProviders', {});
		tmpOAuthAreaElements[0].innerHTML = tmpOAuthHTML;
		tmpOAuthAreaElements[0].style.display = 'block';

		// Build individual provider buttons
		let tmpButtonContainer = tmpOAuthAreaElements[0].querySelector('#pict-login-oauth-buttons');
		if (!tmpButtonContainer)
		{
			return;
		}

		let tmpButtonsHTML = '';
		for (let i = 0; i < this.oauthProviders.length; i++)
		{
			let tmpProvider = this.oauthProviders[i];
			let tmpName = tmpProvider.Name || 'provider';
			let tmpBeginURL = tmpProvider.BeginURL || (this.options.OAuthBeginEndpoint + '/' + tmpName);
			let tmpDisplayName = tmpName.charAt(0).toUpperCase() + tmpName.slice(1);
			let tmpCSSModifier = tmpName.toLowerCase();

			tmpButtonsHTML += '<a class="pict-login-oauth-btn pict-login-oauth-btn--' + tmpCSSModifier + '" href="' + tmpBeginURL + '">Sign in with ' + tmpDisplayName + '</a>';
		}

		tmpButtonContainer.innerHTML = tmpButtonsHTML;
	}

	/**
	 * Store session data at the configured Pict address.
	 * @param {object|null} pData - Session data to store
	 */
	_storeSessionData(pData)
	{
		if (this.options.SessionDataAddress)
		{
			let tmpAddressSpace =
			{
				Fable: this.fable,
				Pict: this.fable,
				AppData: this.pict.AppData,
				Bundle: this.pict.Bundle
			};
			this.fable.manifest.setValueByHash(tmpAddressSpace, this.options.SessionDataAddress, pData);
		}
	}

	/**
	 * Trigger a solve on the PictApplication if one exists.
	 */
	_solveApp()
	{
		if (this.pict && this.pict.PictApplication && typeof (this.pict.PictApplication.solve) === 'function')
		{
			this.pict.PictApplication.solve();
		}
	}
}

module.exports = PictSectionLogin;

module.exports.default_configuration = _DefaultConfiguration;
