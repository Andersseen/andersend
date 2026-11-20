## Purpose

Defines how the API behaves when deployed to Cloudflare's production environment, as opposed to
the local mock-provider development setup.

## ADDED Requirements

### Requirement: Production sends through Cloudflare Email Service

When deployed with the production environment, the API SHALL send queued emails through the
Cloudflare Email Service binding instead of the mock provider, and a successful hand-off SHALL
leave the email in status `sent`.

#### Scenario: Email accepted in production

- **WHEN** `POST /v1/emails` is called on the production deployment with a valid key and payload
- **THEN** the email is queued, handed to Cloudflare Email Service, and ends in status `sent`
  (or `failed` with the provider's error code if Cloudflare rejects it)

### Requirement: Development-only routes are hidden in production

The API SHALL respond `404` to `/v1/dev/*` routes in the production environment.

#### Scenario: Reset attempted in production

- **WHEN** an authenticated request calls `POST /v1/dev/reset` on the production deployment
- **THEN** the API responds `404` and no data is changed

### Requirement: CORS origins are configurable

The API SHALL allow cross-origin browser requests only from the origins listed in the
comma-separated `CORS_ORIGINS` setting, defaulting to `http://localhost:5173` when it is unset.

#### Scenario: Allowed origin

- **WHEN** a browser request arrives with an `Origin` listed in `CORS_ORIGINS`
- **THEN** the response carries `Access-Control-Allow-Origin` set to that origin

#### Scenario: Unlisted origin

- **WHEN** a browser request arrives with an `Origin` not listed in `CORS_ORIGINS`
- **THEN** the response carries no `Access-Control-Allow-Origin` for that origin
