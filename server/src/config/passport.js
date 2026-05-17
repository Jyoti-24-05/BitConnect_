// server/src/config/passport.js
import passport                from "passport";
import { Strategy as Google }  from "passport-google-oauth20";
import { Strategy as GitHub }  from "passport-github2";
import User                    from "../models/User.model.js";

// ─── Google OAuth Strategy ────────────────────────────────────────────────────
passport.use(
  new Google(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.SERVER_URL}/api/v1/auth/google/callback`,
      scope:        ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email    = profile.emails?.[0]?.value;
        const avatar   = profile.photos?.[0]?.value;
        const fullName = profile.displayName;

        if (!email) return done(new Error("No email found in Google profile"), null);

        // Find existing user or create new one (upsert pattern)
        let user = await User.findOne({ email });

        if (user) {
          // Existing user — update avatar if they don't have one
          if (!user.profilePicture && avatar) {
            user.profilePicture = avatar;
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // New user via Google — generate a safe username from their name
        const baseUsername = fullName
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
          .slice(0, 25);

        // Ensure username uniqueness by appending random suffix if needed
        let username = baseUsername;
        const exists = await User.findOne({ username });
        if (exists) username = `${baseUsername}_${Math.floor(Math.random() * 9999)}`;

        user = await User.create({
          username,
          email,
          // Random secure password — they'll use OAuth, not password login
          password:       Math.random().toString(36).slice(-16) + "A1@x",
          profilePicture: avatar ?? "",
          isVerified:     true, // Google verified the email
          role:           "student",
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ─── GitHub OAuth Strategy ────────────────────────────────────────────────────
passport.use(
  new GitHub(
    {
      clientID:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:  `${process.env.SERVER_URL}/api/v1/auth/github/callback`,
      scope:        ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub may not expose email publicly — fall back to profile emails array
        const email =
          profile.emails?.find((e) => e.primary)?.value ||
          profile.emails?.[0]?.value;

        if (!email)
          return done(new Error("No email found — enable email visibility in GitHub settings"), null);

        let user = await User.findOne({ email });

        if (user) return done(null, user);

        // Sanitise GitHub username for our schema rules
        const baseUsername = profile.username
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 25);

        let username = baseUsername;
        const exists = await User.findOne({ username });
        if (exists) username = `${baseUsername}_${Math.floor(Math.random() * 9999)}`;

        user = await User.create({
          username,
          email,
          password:       Math.random().toString(36).slice(-16) + "A1@x",
          profilePicture: profile.photos?.[0]?.value ?? "",
          socialLinks:    { github: profile.profileUrl ?? "" },
          isVerified:     true,
          role:           "student",
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ─── Session serialisation ────────────────────────────────────────────────────
// We use JWT not sessions — but passport still needs these defined
passport.serializeUser((user, done)   => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;