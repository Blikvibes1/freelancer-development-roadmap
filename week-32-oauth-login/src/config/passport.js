/**
 * Passport strategies for Google + GitHub.
 * If client IDs are missing, strategies are not registered (demo mode).
 */

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const { randomUUID } = require("crypto");
const { withDb, read } = require("../data/store");

function upsertOAuthUser(profile, provider) {
  const providerId = String(profile.id);
  const email =
    (profile.emails && profile.emails[0] && profile.emails[0].value) ||
    `${provider}_${providerId}@oauth.local`;
  const name =
    profile.displayName ||
    profile.username ||
    (profile.name &&
      `${profile.name.givenName || ""} ${profile.name.familyName || ""}`.trim()) ||
    "OAuth User";
  const avatar =
    (profile.photos && profile.photos[0] && profile.photos[0].value) || null;

  return withDb((db) => {
    let user = db.users.find(
      (u) =>
        u.providers &&
        u.providers.some((p) => p.provider === provider && p.providerId === providerId)
    );

    if (!user) {
      // Link by email if exists
      user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        user.providers = user.providers || [];
        user.providers.push({ provider, providerId });
        user.avatar = user.avatar || avatar;
        user.name = user.name || name;
      } else {
        user = {
          id: randomUUID(),
          name,
          email: email.toLowerCase(),
          avatar,
          providers: [{ provider, providerId }],
          role: "user",
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
      }
    } else {
      user.name = name || user.name;
      user.avatar = avatar || user.avatar;
    }

    return user;
  });
}

function configurePassport() {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    const user = read().users.find((u) => u.id === id);
    done(null, user || false);
  });

  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  const githubId = process.env.GITHUB_CLIENT_ID;
  const githubSecret = process.env.GITHUB_CLIENT_SECRET;
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  if (googleId && googleSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleId,
          clientSecret: googleSecret,
          callbackURL: `${baseUrl}/auth/google/callback`,
        },
        (accessToken, refreshToken, profile, done) => {
          try {
            const user = upsertOAuthUser(profile, "google");
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
    console.log("Passport: Google strategy enabled");
  } else {
    console.log("Passport: Google strategy disabled (set GOOGLE_CLIENT_ID/SECRET)");
  }

  if (githubId && githubSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: githubId,
          clientSecret: githubSecret,
          callbackURL: `${baseUrl}/auth/github/callback`,
          scope: ["user:email"],
        },
        (accessToken, refreshToken, profile, done) => {
          try {
            const user = upsertOAuthUser(profile, "github");
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
    console.log("Passport: GitHub strategy enabled");
  } else {
    console.log("Passport: GitHub strategy disabled (set GITHUB_CLIENT_ID/SECRET)");
  }

  return {
    googleEnabled: Boolean(googleId && googleSecret),
    githubEnabled: Boolean(githubId && githubSecret),
  };
}

module.exports = { configurePassport, upsertOAuthUser };
