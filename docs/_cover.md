# Pict Section Login

> A drop-in login section for Pict applications

Register it as a Pict view, point it at your auth endpoints, and you get a styled login form, session check, logout, and OAuth button support in a single view class. Override four lifecycle hooks to wire it to your application state, and pair it with pict-router for route-guarded navigation.

- **Drop-In View** -- One `pict.addView(...)` call gives you a complete login form
- **Orator-Authentication Ready** -- Default endpoints match the standard routes
- **Custom Backend Friendly** -- Every endpoint is configurable; POST and GET both supported
- **Session Management** -- `login`, `logout`, and `checkSession` with AppData integration
- **OAuth Providers** -- Optional OAuth row populated from a providers endpoint
- **Override Hooks** -- Four clean hooks for post-auth navigation and state updates
- **Router Friendly** -- Designed to cooperate with pict-router for route guards and post-login redirects

[Overview](README.md)
[Quick Start](quickstart.md)
[Embedding Guide](embedding-guide.md)
[Router Integration](router-integration.md)
[GitHub](https://github.com/fable-retold/pict-section-login)
