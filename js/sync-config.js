// Supabase connection for optional cross-device sync.
// The anon key is designed to be public and is safe to commit: the database only
// exposes two functions to it (see supabase/sync.sql), each scoped to one sync code.
// NEVER put the service_role key (or any "secret" key) in this repository.
// A newer "sb_publishable_…" key works here too, in place of the legacy anon JWT.
export const SYNC_CONFIG={
  url:'https://okvlsllyazwpshtkapge.supabase.co',
  key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rdmxzbGx5YXp3cHNodGthcGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTg5MjEsImV4cCI6MjEwNTc5NDkyMX0.tBF5EgQfWDaLhHip_vVojw1O0FdgFRU9XZzOq4yN3FQ'
};
