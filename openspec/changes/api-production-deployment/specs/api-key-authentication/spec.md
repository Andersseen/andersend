## Purpose

Authenticates every `/v1/*` API request with a per-key secret, so separate consuming projects can
each hold their own revocable key without the plaintext ever being stored.

## ADDED Requirements

### Requirement: Keys are authenticated against stored hashes

The API SHALL accept a `/v1/*` request whose `Authorization: Bearer <key>` header carries a key
whose prefix matches a non-revoked `api_keys` row and whose SHA-256 hash equals that row's
`key_hash`, and SHALL scope the request to that row's project. It MUST NOT store or log the
plaintext key.

#### Scenario: Valid stored key

- **WHEN** a request presents a key minted for project P that has not been revoked
- **THEN** the request is authenticated and scoped to project P

#### Scenario: Wrong secret for an existing prefix

- **WHEN** a request presents a key whose prefix exists but whose secret part differs
- **THEN** the API responds `401` with error code `unauthorized`

#### Scenario: Revoked key

- **WHEN** a request presents a key whose row has `revoked_at` set
- **THEN** the API responds `401` with error code `unauthorized`

### Requirement: Successful authentication records last use

The API SHALL update `last_used_at` on the key row after a request authenticates with it.

#### Scenario: Last use recorded

- **WHEN** a request authenticates with a stored key
- **THEN** that key's `last_used_at` is set to the time of the request

### Requirement: Development key is local-only

Outside the production environment, the API SHALL also accept the `ANDERSEND_API_KEY` environment
value for the default project. In the production environment it MUST ignore that value and MUST
reject any key with the `and_dev_` prefix, even if a matching row exists.

#### Scenario: Dev key locally

- **WHEN** `ENVIRONMENT` is not `production` and a request presents `ANDERSEND_API_KEY`
- **THEN** the request is authenticated for the default project

#### Scenario: Dev key in production

- **WHEN** `ENVIRONMENT` is `production` and a request presents a key starting with `and_dev_`
- **THEN** the API responds `401` with error code `unauthorized`

### Requirement: Keys can be minted from the command line

The project SHALL provide a command that generates a new key of the form
`and_<8 lowercase alphanumerics>_<random secret>`, stores only its prefix and hash for a named
project (creating that project if it does not exist) in the local or remote D1 database, and
prints the plaintext key exactly once.

#### Scenario: Minting a key for a new consumer

- **WHEN** the developer runs the mint command with a key name and `--remote`
- **THEN** a new `api_keys` row exists in the remote database and the printed key authenticates
  against the deployed API
