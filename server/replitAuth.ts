// Authentication system with Replit OAuth and local admin backdoor
// Reference: blueprint:javascript_log_in_with_replit

import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  // OAuth verify function
  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Local admin strategy for emergency backdoor access
  passport.use('local-admin', new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
      try {
        console.log('[AUTH DEBUG] Login attempt:', {
          username,
          usernameMatch: username.toLowerCase() === 'admin',
          passwordLength: password?.length,
          envPasswordLength: process.env.LOCAL_ADMIN_PASSWORD?.length,
          passwordsMatch: password === process.env.LOCAL_ADMIN_PASSWORD,
        });
        
        // Check if credentials match local admin (case-insensitive username)
        if (username.toLowerCase() === 'admin' && password === process.env.LOCAL_ADMIN_PASSWORD) {
          const localAdmin = await storage.getLocalAdmin();
          if (!localAdmin) {
            console.log('[AUTH DEBUG] Local admin not found in database');
            return done(null, false, { message: 'Local admin not configured' });
          }
          console.log('[AUTH DEBUG] Login successful for admin');
          // Create session for local admin
          const user = {
            claims: {
              sub: localAdmin.id,
              email: localAdmin.email,
              first_name: localAdmin.firstName,
              last_name: localAdmin.lastName,
              profile_image_url: localAdmin.profileImageUrl,
              exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week
            },
            isLocalAdmin: true,
            expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
          };
          return done(null, user);
        }
        console.log('[AUTH DEBUG] Credentials do not match');
        return done(null, false, { message: 'Invalid credentials' });
      } catch (error) {
        console.error('[AUTH DEBUG] Error during login:', error);
        return done(error);
      }
    }
  ));

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // OAuth login route
  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Local admin login route
  app.post("/api/login/admin", (req, res, next) => {
    passport.authenticate('local-admin', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({ success: true, message: "Local admin authenticated" });
      });
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const user = req.user as any;
    
    // If local admin, just clear session
    if (user?.isLocalAdmin) {
      req.logout(() => {
        res.redirect("/");
      });
      return;
    }
    
    // OAuth logout
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Local admin sessions don't need token refresh
  if (user.isLocalAdmin) {
    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }
    return res.status(401).json({ message: "Session expired" });
  }

  // OAuth token refresh logic
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// Role-based authorization middleware
export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const dbUser = await storage.getUser(user.claims.sub);
  if (!dbUser || (dbUser.role !== "admin" && !dbUser.isLocalAdmin)) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  next();
};

export const isManagerOrAbove: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const dbUser = await storage.getUser(user.claims.sub);
  if (!dbUser || (!["admin", "manager"].includes(dbUser.role) && !dbUser.isLocalAdmin)) {
    return res.status(403).json({ message: "Forbidden: Manager or Admin access required" });
  }
  
  next();
};
