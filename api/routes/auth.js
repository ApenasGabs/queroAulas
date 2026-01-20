import express from "express";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173",
});

/**
 * Exchange authorization code for access token
 * POST /api/auth/exchange
 */
router.post("/exchange", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    const { tokens } = await client.getToken(code);

    // Get user info
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userInfo = await userInfoResponse.json();

    // In production, store refresh_token in database encrypted
    // For now, return everything (tokens will be stored in httpOnly cookies via middleware)

    console.log("[Auth Exchange] Success! User:", {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
    });
    res.json({
      success: true,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
      tokens: {
        accessToken: access_token,
        expiresAt: expiry_date,
        // Don't send refresh_token to frontend in production
        ...(process.env.NODE_ENV === "development" && {
          refreshToken: refresh_token,
        }),
      },
    });
  } catch (error) {
    console.error("[Auth Exchange Error]", error);
    res.status(401).json({
      error: "Authentication failed",
      message: error.message,
    });
  }
});

/**
 * Verify ID token from Google
 * POST /api/auth/verify
 */
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Additional validation
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error("Invalid audience");
    }

    if (payload.exp < Date.now() / 1000) {
      throw new Error("Token expired");
    }

    res.json({
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Token Verification Error]", error);
    }
    res.status(401).json({
      error: "Invalid token",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * Revoke access token
 * POST /api/auth/revoke
 */
router.post("/revoke", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Revoke token on Google
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    res.json({ success: true, message: "Token revoked successfully" });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Token Revocation Error]", error);
    }
    res.status(500).json({
      error: "Failed to revoke token",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();

    res.json({
      success: true,
      tokens: {
        accessToken: credentials.access_token,
        expiresAt: credentials.expiry_date,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Token Refresh Error]", error);
    }
    res.status(401).json({
      error: "Failed to refresh token",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
