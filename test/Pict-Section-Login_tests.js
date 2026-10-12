/*
	Unit tests for Pict-Section-Login
*/

const libBrowserEnv = require('browser-env');
libBrowserEnv();

const Chai = require('chai');
const Expect = Chai.expect;

const libPict = require('pict');

const configureTestPict = (pPict) =>
{
	let tmpPict = (typeof (pPict) == 'undefined') ? new libPict() : pPict;
	tmpPict.TestData = (
		{
			Reads: [],
			Assignments: [],
			Appends: [],
			Gets: []
		});
	tmpPict.ContentAssignment.customReadFunction = (pAddress, pContentType) =>
	{
		tmpPict.TestData.Reads.push(pAddress);
		tmpPict.log.info(`Mocking a read of type ${pContentType} from Address: ${pAddress}`);
		return '';
	};
	tmpPict.ContentAssignment.customGetElementFunction = (pAddress) =>
	{
		tmpPict.TestData.Gets.push(pAddress);
		tmpPict.log.info(`Mocking a get of Address: ${pAddress}`);
		return '';
	};
	tmpPict.ContentAssignment.customAppendElementFunction = (pAddress, pContent) =>
	{
		tmpPict.TestData.Appends.push(pAddress);
		tmpPict.log.info(`Mocking an append of Address: ${pAddress}`, { Content: pContent });
		return '';
	};
	tmpPict.ContentAssignment.customAssignFunction = (pAddress, pContent) =>
	{
		tmpPict.TestData.Assignments.push(pAddress);
		tmpPict.log.info(`Mocking an assignment of Address: ${pAddress}`, { Content: pContent });
		return '';
	};

	return tmpPict;
};

const libPictSectionLogin = require('../source/Pict-Section-Login.js');

suite
(
	'PictSectionLogin',
	() =>
	{
		setup(() => { });

		suite
		(
			'Module Exports',
			() =>
			{
				test
				(
					'Main class should be exported',
					(fDone) =>
					{
						Expect(libPictSectionLogin).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'Default configuration should be exported',
					(fDone) =>
					{
						Expect(libPictSectionLogin.default_configuration).to.be.an('object');
						Expect(libPictSectionLogin.default_configuration).to.have.property('DefaultRenderable');
						Expect(libPictSectionLogin.default_configuration).to.have.property('LoginEndpoint');
						Expect(libPictSectionLogin.default_configuration).to.have.property('LogoutEndpoint');
						Expect(libPictSectionLogin.default_configuration).to.have.property('CheckSessionEndpoint');
						Expect(libPictSectionLogin.default_configuration).to.have.property('CSS');
						Expect(libPictSectionLogin.default_configuration).to.have.property('Templates');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Default Configuration',
			() =>
			{
				test
				(
					'Should have orator-authentication default endpoints',
					(fDone) =>
					{
						let tmpConfig = libPictSectionLogin.default_configuration;
						Expect(tmpConfig.LoginEndpoint).to.equal('/1.0/Authenticate');
						Expect(tmpConfig.LogoutEndpoint).to.equal('/1.0/Deauthenticate');
						Expect(tmpConfig.CheckSessionEndpoint).to.equal('/1.0/CheckSession');
						Expect(tmpConfig.OAuthProvidersEndpoint).to.equal('/1.0/OAuth/Providers');
						Expect(tmpConfig.OAuthBeginEndpoint).to.equal('/1.0/OAuth/Begin');
						return fDone();
					}
				);
				test
				(
					'Should default to POST login method',
					(fDone) =>
					{
						Expect(libPictSectionLogin.default_configuration.LoginMethod).to.equal('POST');
						return fDone();
					}
				);
				test
				(
					'Should have CheckSessionOnLoad enabled by default',
					(fDone) =>
					{
						Expect(libPictSectionLogin.default_configuration.CheckSessionOnLoad).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'Should have ShowOAuthProviders disabled by default',
					(fDone) =>
					{
						Expect(libPictSectionLogin.default_configuration.ShowOAuthProviders).to.equal(false);
						return fDone();
					}
				);
				test
				(
					'Should have a SessionDataAddress',
					(fDone) =>
					{
						Expect(libPictSectionLogin.default_configuration.SessionDataAddress).to.equal('AppData.Session');
						return fDone();
					}
				);
				test
				(
					'Should include the base + magic-link templates',
					(fDone) =>
					{
						let tmpTemplates = libPictSectionLogin.default_configuration.Templates;
						Expect(tmpTemplates).to.be.an('array');
						Expect(tmpTemplates.length).to.equal(8);
						let tmpHashes = tmpTemplates.map((pT) => pT.Hash);
						Expect(tmpHashes).to.include('Pict-Login-Template-Wrapper');
						Expect(tmpHashes).to.include('Pict-Login-Template-Form');
						Expect(tmpHashes).to.include('Pict-Login-Template-Status');
						Expect(tmpHashes).to.include('Pict-Login-Template-OAuthProviders');
						Expect(tmpHashes).to.include('Pict-Login-Template-Error');
						Expect(tmpHashes).to.include('Pict-Login-Template-MagicToggle');
						Expect(tmpHashes).to.include('Pict-Login-Template-MagicForm');
						Expect(tmpHashes).to.include('Pict-Login-Template-MagicSent');
						return fDone();
					}
				);
				test
				(
					'Should include CSS',
					(fDone) =>
					{
						Expect(libPictSectionLogin.default_configuration.CSS).to.be.a('string');
						Expect(libPictSectionLogin.default_configuration.CSS).to.contain('.pict-login-card');
						Expect(libPictSectionLogin.default_configuration.CSS).to.contain('.pict-login-form');
						Expect(libPictSectionLogin.default_configuration.CSS).to.contain('.pict-login-oauth');
						return fDone();
					}
				);
				test
				(
					'Should default the magic-link endpoints and keep it off by default',
					(fDone) =>
					{
						let tmpConfig = libPictSectionLogin.default_configuration;
						Expect(tmpConfig.MagicLinkRequestEndpoint).to.equal('/1.0/Login/MagicLink/Request');
						Expect(tmpConfig.MagicLinkVerifyEndpoint).to.equal('/1.0/Login/MagicLink/Verify');
						Expect(tmpConfig.ShowMagicLink).to.equal(false);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Basic Initialization',
			() =>
			{
				test
				(
					'Should create a view instance with default options',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin', {}, libPictSectionLogin);
						Expect(tmpView).to.be.an('object');
						Expect(tmpView.authenticated).to.equal(false);
						Expect(tmpView.sessionData).to.equal(null);
						Expect(tmpView.oauthProviders).to.be.an('array').that.is.empty;
						return fDone();
					}
				);
				test
				(
					'Should expose the magic-link API when enabled',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Magic', { ShowMagicLink: true }, libPictSectionLogin);
						Expect(tmpView.magicLinkMode).to.equal(false);
						Expect(tmpView.requestMagicLink).to.be.a('function');
						Expect(tmpView.verifyMagicLink).to.be.a('function');
						Expect(tmpView.showMagicLinkForm).to.be.a('function');
						Expect(tmpView.showPasswordForm).to.be.a('function');
						Expect(tmpView.options.ShowMagicLink).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'Should create a view with custom endpoints',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestLogin-Custom',
							{
								LoginEndpoint: '/api/custom-login',
								LogoutEndpoint: '/api/custom-logout',
								CheckSessionEndpoint: '/api/custom-session'
							},
							libPictSectionLogin
						);
						Expect(tmpView.options.LoginEndpoint).to.equal('/api/custom-login');
						Expect(tmpView.options.LogoutEndpoint).to.equal('/api/custom-logout');
						Expect(tmpView.options.CheckSessionEndpoint).to.equal('/api/custom-session');
						return fDone();
					}
				);
				test
				(
					'Should create a view with GET login method',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestLogin-GET',
							{
								LoginMethod: 'GET'
							},
							libPictSectionLogin
						);
						Expect(tmpView.options.LoginMethod).to.equal('GET');
						return fDone();
					}
				);
				test
				(
					'Should create a view with custom session data address',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestLogin-Address',
							{
								SessionDataAddress: 'AppData.Auth.CurrentSession'
							},
							libPictSectionLogin
						);
						Expect(tmpView.options.SessionDataAddress).to.equal('AppData.Auth.CurrentSession');
						return fDone();
					}
				);
				test
				(
					'Should create a view with ShowOAuthProviders enabled',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestLogin-OAuth',
							{
								ShowOAuthProviders: true
							},
							libPictSectionLogin
						);
						Expect(tmpView.options.ShowOAuthProviders).to.equal(true);
						return fDone();
					}
				);
				test
				(
					'Should create a view with CheckSessionOnLoad disabled',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView(
							'Pict-View-TestLogin-NoCheck',
							{
								CheckSessionOnLoad: false
							},
							libPictSectionLogin
						);
						Expect(tmpView.options.CheckSessionOnLoad).to.equal(false);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Public API',
			() =>
			{
				test
				(
					'login should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-API1', {}, libPictSectionLogin);
						Expect(tmpView.login).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'logout should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-API2', {}, libPictSectionLogin);
						Expect(tmpView.logout).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'checkSession should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-API3', {}, libPictSectionLogin);
						Expect(tmpView.checkSession).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'loadOAuthProviders should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-API4', {}, libPictSectionLogin);
						Expect(tmpView.loadOAuthProviders).to.be.a('function');
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Overridable Hooks',
			() =>
			{
				test
				(
					'onLoginSuccess should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Hook1', {}, libPictSectionLogin);
						Expect(tmpView.onLoginSuccess).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'onLoginFailed should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Hook2', {}, libPictSectionLogin);
						Expect(tmpView.onLoginFailed).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'onLogout should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Hook3', {}, libPictSectionLogin);
						Expect(tmpView.onLogout).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'onSessionChecked should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Hook4', {}, libPictSectionLogin);
						Expect(tmpView.onSessionChecked).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'Hooks should be overridable on the instance',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Hook5', {}, libPictSectionLogin);
						let tmpCalled = false;
						tmpView.onLoginSuccess = () => { tmpCalled = true; };
						tmpView.onLoginSuccess({});
						Expect(tmpCalled).to.equal(true);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'State Management',
			() =>
			{
				test
				(
					'Should start with authenticated = false',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-State1', {}, libPictSectionLogin);
						Expect(tmpView.authenticated).to.equal(false);
						return fDone();
					}
				);
				test
				(
					'Should start with sessionData = null',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-State2', {}, libPictSectionLogin);
						Expect(tmpView.sessionData).to.equal(null);
						return fDone();
					}
				);
				test
				(
					'Should start with empty oauthProviders array',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-State3', {}, libPictSectionLogin);
						Expect(tmpView.oauthProviders).to.be.an('array').that.is.empty;
						return fDone();
					}
				);
				test
				(
					'Should start with initialRenderComplete = false',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-State4', {}, libPictSectionLogin);
						Expect(tmpView.initialRenderComplete).to.equal(false);
						return fDone();
					}
				);
			}
		);

		suite
		(
			'Internal Helpers',
			() =>
			{
				test
				(
					'_displayError should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Helper1', {}, libPictSectionLogin);
						Expect(tmpView._displayError).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'_clearError should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Helper2', {}, libPictSectionLogin);
						Expect(tmpView._clearError).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'_updateView should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Helper3', {}, libPictSectionLogin);
						Expect(tmpView._updateView).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'_storeSessionData should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Helper4', {}, libPictSectionLogin);
						Expect(tmpView._storeSessionData).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'_renderOAuthButtons should be a function',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-Helper5', {}, libPictSectionLogin);
						Expect(tmpView._renderOAuthButtons).to.be.a('function');
						return fDone();
					}
				);
				test
				(
					'_updateView is called during initial render to populate form',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-RenderUpdate',
							{
								AutoRender: false,
								CheckSessionOnLoad: false,
								ShowOAuthProviders: false
							},
							libPictSectionLogin);

						let tmpUpdateViewCalled = false;
						let tmpOriginalUpdateView = tmpView._updateView.bind(tmpView);
						tmpView._updateView = function()
						{
							tmpUpdateViewCalled = true;
							tmpOriginalUpdateView();
						};

						// Before render, _updateView has not been called
						Expect(tmpUpdateViewCalled).to.equal(false);
						Expect(tmpView.initialRenderComplete).to.equal(false);

						// Trigger render
						tmpView.render();

						// After render, _updateView should have been called
						// as part of onAfterInitialRender
						Expect(tmpUpdateViewCalled).to.equal(true);
						Expect(tmpView.initialRenderComplete).to.equal(true);

						return fDone();
					}
				);
				test
				(
					'_updateView is only called once for initial render (not on subsequent renders)',
					(fDone) =>
					{
						let tmpPict = configureTestPict();
						let tmpView = tmpPict.addView('Pict-View-TestLogin-RenderOnce',
							{
								AutoRender: false,
								CheckSessionOnLoad: false,
								ShowOAuthProviders: false
							},
							libPictSectionLogin);

						let tmpUpdateViewCallCount = 0;
						let tmpOriginalUpdateView = tmpView._updateView.bind(tmpView);
						tmpView._updateView = function()
						{
							tmpUpdateViewCallCount++;
							tmpOriginalUpdateView();
						};

						// First render triggers _updateView via onAfterInitialRender
						tmpView.render();
						Expect(tmpUpdateViewCallCount).to.equal(1);

						// Second render should NOT trigger onAfterInitialRender again
						tmpView.render();
						Expect(tmpUpdateViewCallCount).to.equal(1);

						return fDone();
					}
				);
			}
		);
	}
);
