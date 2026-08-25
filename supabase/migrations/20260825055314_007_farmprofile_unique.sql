/*
# Add unique constraint on farmer_profiles.user_id

Prevents duplicate farmer profile rows per user.
*/
ALTER TABLE farmer_profiles ADD CONSTRAINT farmer_profiles_user_id_unique UNIQUE (user_id);
