-- Script to make a user Admin and verify their email
-- Usage: Replace 'your-email@example.com' with the actual email

-- Option 1: Make user admin and verify email by email address
UPDATE User 
SET isAdmin = 1, isEmailVerified = 1 
WHERE email = 'your-email@example.com';

-- Option 2: Make user admin and verify email by ID
-- UPDATE User 
-- SET isAdmin = 1, isEmailVerified = 1 
-- WHERE id = 1;

-- Option 3: Make ALL users admin and verified (for development only!)
-- UPDATE User 
-- SET isAdmin = 1, isEmailVerified = 1;

-- View all users
SELECT id, email, isEmailVerified, isAdmin, createdAt FROM User;
