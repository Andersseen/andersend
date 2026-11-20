-- Auth looks a presented key up by its prefix, so two rows sharing a prefix
-- would make the lookup ambiguous. Minting is random (36^8 ids), so this is a
-- guarantee rather than a practical concern: a collision now fails the insert
-- loudly instead of producing a key that never authenticates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
