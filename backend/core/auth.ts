import { api } from "encore.dev/api";
import { PrismaClient } from "@prisma/client";
import { RedisService } from "./redis";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { RateLimitError } from "./errors";
import { Logger } from "./logger";

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Types for EspoCRM API responses
interface EspoCRMUser {
  id: string;
  userName: string;
  name: string;
  emailAddress?: string;
  type?: string;
  [key: string]: any;
}

interface EspoCRMListResponse {
  list: EspoCRMUser[];
  total: number;
}

interface UserProfileRequest {
  req: {
    headers: {
      authorization?: string;
    };
  };
}

interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  userName: string;
  role: string; // Primary role name (e.g., "Admin", "User")
  isAdmin: boolean;
  preferences: any;
}

// Types for request/response
interface LoginRequest {
  username: string;
  password: string;
  tenantId?: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    userName: string;
    role: string;
    isAdmin: boolean;
  };
  expiresAt: number;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  user?: {
    id: string;
    name: string;
    email: string;
    userName: string;
    role: string;
    isAdmin: boolean;
  };
  expiresAt: number;
}

interface LogoutRequest {
  token: string;
}

interface LogoutResponse {
  success: boolean;
}

interface LogoutAllRequest {
  req: {
    headers: {
      authorization?: string;
    };
  };
}

// AuthService class
export class AuthService {
  private prisma: PrismaClient;
  private redis: RedisService;
  private static instance: AuthService;

  // Singleton pattern
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private constructor() {
    this.prisma = new PrismaClient();
    this.redis = RedisService.getInstance();
  }

  // Get primary role name for a user (returns first role or "user" if none)
  private async getPrimaryRoleName(userId: string): Promise<string> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.length > 0 ? userRoles[0].role.name : "user";
  }

  // Authenticate user against EspoCRM and create local user if needed
  async login(username: string, password: string, tenantId?: string, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    // Get tenant info
    let tenant;
    const rateKey = `ratelimit:login:${username}`;
    const attempts = await this.redis.incrementRateLimit(rateKey, 60); // 1 minute

    if (attempts > 5) {
      Logger.warn(`Rate limit exceeded for ${username}`);
      throw new RateLimitError();
    }
  
    if (tenantId) {
      tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
    } else {
      // Get the first tenant if not specified (for single-tenant mode)
      tenant = await this.prisma.tenant.findFirst();
    }

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    try {
      // Authenticate with EspoCRM using Basic Auth
      const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
      
      const response = await fetch(`${tenant.espoCrmUrl}/api/v1/user`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json() as EspoCRMListResponse;
      const matchedUser = data.list.find((user) => user.userName === username);
      
      if (!matchedUser) {
        throw new Error("User not found");
      }

      const espoUserId = matchedUser.id;
      
      // Get user details from EspoCRM
      const userDetailsResponse = await fetch(`${tenant.espoCrmUrl}/api/v1/user/${espoUserId}`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });

      if (!userDetailsResponse.ok) {
        throw new Error("Failed to retrieve user details");
      }

      const userDetails = await userDetailsResponse.json() as EspoCRMUser;
      
      // Check if user exists in our system
      let user = await this.prisma.user.findUnique({
        where: {
          espoCrmUserId: espoUserId,
        },
        include: {
          roles: {
            include: { role: true },
          },
        },
      });

      // Determine if the user is an admin based on EspoCRM type
      const isAdmin = userDetails.type ? ['Admin', 'Administrator', 'admin', 'administrator'].includes(userDetails.type) : false;
      const roleExternalId = isAdmin ? 'espocrm-admin' : 'espocrm-user';

      // Create user if not exists
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            id: uuidv4(),
            espoCrmUserId: espoUserId,
            email: userDetails.emailAddress || `${username}@example.com`,
            userName: userDetails.userName,
            name: userDetails.name,
            tenantId: tenant.id,
            isAdmin,
            // Remove the roles: undefined line - don't explicitly set roles here
          },
          include: {
            roles: {
              include: { role: true },
            },
          },
        });

        // Assign role
        const targetRole = await this.prisma.role.findUnique({
          where: { externalId: roleExternalId },
        });

        if (targetRole) {
          await this.prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: targetRole.id,
              createdAt: new Date(),
            },
          });
        } else {
          Logger.warn(`Role ${roleExternalId} not found for new user ${user.id}`);
        }

        // Create default user preferences
        await this.prisma.userPreference.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
          },
        });
      } else {
        // Update isAdmin status if changed
        if (user.isAdmin !== isAdmin) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              isAdmin,
              lastLoginAt: new Date(),
            },
            include: {
              roles: {
                include: { role: true },
              },
            },
          });
        } else {
          // Just update last login time
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
            include: {
              roles: {
                include: { role: true },
              },
            },
          });
        }

        // Update roles
        const targetRole = await this.prisma.role.findUnique({
          where: { externalId: roleExternalId },
        });

        if (targetRole) {
          const hasTargetRole = user.roles.some(
            (userRole: { roleId: any; }) => userRole.roleId === targetRole.id
          );

          if (!hasTargetRole) {
            // Replace existing roles with the new one
            await this.prisma.userRole.deleteMany({
              where: { userId: user.id },
            });

            await this.prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: targetRole.id,
                createdAt: new Date(),
              },
            });
            Logger.info(`Assigned role ${targetRole.name} to user ${user.id}`);
          }
        } else {
          Logger.warn(`Role ${roleExternalId} not found for user ${user.id}`);
        }
      }

      // Get primary role for response and JWT
      const primaryRole = await this.getPrimaryRoleName(user.id);

      // Generate JWT token
      const payload = {
        userId: user.id,
        tenantId: tenant.id,
        role: primaryRole,
        isAdmin: user.isAdmin,
        type: "access",
      };
      
      const token = jwt.sign(payload, JWT_SECRET);

      // Generate refresh token
      const refreshPayload = {
        userId: user.id,
        type: "refresh",
      };
      
      const refreshToken = jwt.sign(refreshPayload, JWT_SECRET);

      // Calculate expiry dates
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 1); // 1 day from now

      const refreshExpiresAt = new Date(now);
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days from now

      // Store session in database
      await this.prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
          ipAddress: ipAddress || "",
          userAgent: userAgent || "",
        },
      });

      // Store refresh token in database
      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: refreshExpiresAt,
        },
      });

      // Save EspoCRM auth token in Redis for API calls
      await this.redis.set(`espo:auth:${user.id}`, authHeader, 3600); // 1 hour expiry

      Logger.info(`User ${username} logged in successfully`, {
        userId: user.id,
        tenantId: tenant.id,
      });
      
      await this.prisma.loginAttempt.create({
        data: {
          username,
          ip: ipAddress,
          userAgent,
          success: true,
        },
      });

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userName: user.userName,
          role: primaryRole,
          isAdmin: user.isAdmin,
        },
        expiresAt: expiresAt.getTime(),
      };
    } catch (error: any) {
      await this.prisma.loginAttempt.create({
        data: {
          username,
          ip: ipAddress,
          userAgent,
          success: false,
        },
      });
    
      Logger.error("Authentication error:", error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Verify JWT token and return user data
  async verifyToken(token: string): Promise<any> {
    try {
      // Verify JWT signature
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      
      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      // Check if session exists in DB
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              roles: {
                include: { role: true },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      if (new Date() > session.expiresAt) {
        // Delete expired session
        await this.prisma.session.delete({
          where: { id: session.id },
        });
        throw new Error("Session expired");
      }

      const primaryRole = await this.getPrimaryRoleName(session.user.id);

      return {
        user: {
          ...session.user,
          role: primaryRole, // Add role for compatibility
        },
        tokenData: decoded,
      };
    } catch (error: any) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Refresh access token using refresh token
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as jwt.JwtPayload;
      
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      // Check if refresh token exists
      const storedRefreshToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedRefreshToken) {
        throw new Error("Refresh token not found");
      }

      if (new Date() > storedRefreshToken.expiresAt) {
        // Delete expired refresh token
        await this.prisma.refreshToken.delete({
          where: { id: storedRefreshToken.id },
        });
        throw new Error("Refresh token expired");
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: storedRefreshToken.userId },
        include: {
          tenant: true,
          roles: {
            include: { role: true },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Get primary role
      const primaryRole = await this.getPrimaryRoleName(user.id);

      // Generate new access token
      const payload = {
        userId: user.id,
        tenantId: user.tenantId,
        role: primaryRole,
        isAdmin: user.isAdmin,
        type: "access",
      };
      
      const newToken = jwt.sign(payload, JWT_SECRET);

      // Calculate new expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // 1 day from now

      // Store new session
      await this.prisma.session.create({
        data: {
          token: newToken,
          userId: user.id,
          expiresAt,
        },
      });

      // Generate new refresh token
      const refreshPayload = {
        userId: user.id,
        type: "refresh",
      };
      
      const newRefreshToken = jwt.sign(refreshPayload, JWT_SECRET);
      
      // Calculate new refresh token expiry date
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days from now
      
      // Update refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedRefreshToken.id },
        data: {
          token: newRefreshToken,
          expiresAt: refreshExpiresAt,
        },
      });

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userName: user.userName,
          role: primaryRole,
          isAdmin: user.isAdmin,
        },
        expiresAt: expiresAt.getTime(),
      };
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Logout user
  async logout(token: string): Promise<void> {
    // Find session
    const session = await this.prisma.session.findUnique({
      where: { token },
      select: { userId: true },
    });

    if (session) {
      // Clear EspoCRM auth from Redis
      await this.redis.delete(`espo:auth:${session.userId}`);
      
      // Delete session
      await this.prisma.session.deleteMany({
        where: { token },
      });
    }
  }

  // Revoke all sessions for a user (logout from all devices)
  async logoutAll(userId: string): Promise<void> {
    // Clear EspoCRM auth from Redis
    await this.redis.delete(`espo:auth:${userId}`);
    
    // Delete all sessions for user
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  // Get EspoCRM auth header for a user
  async getEspoCRMAuth(userId: string): Promise<string | null> {
    return this.redis.get<string>(`espo:auth:${userId}`);
  }
}

// Login endpoint
export const login = api(
  { expose: true, method: "POST", path: "/auth/login" },
  async function(params: LoginRequest): Promise<LoginResponse> {
    const authService = AuthService.getInstance();
    return authService.login(
      params.username, 
      params.password, 
      params.tenantId
    );
  }
);

// Refresh token endpoint
export const refreshToken = api(
  { expose: true, method: "POST", path: "/auth/refresh" },
  async function(params: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const authService = AuthService.getInstance();
    return authService.refreshToken(params.refreshToken);
  }
);

// Logout endpoint
export const logout = api(
  { expose: true, method: "POST", path: "/auth/logout" },
  async function(params: LogoutRequest): Promise<LogoutResponse> {
    const authService = AuthService.getInstance();
    await authService.logout(params.token);
    return { success: true };
  }
);

// Create a separate middleware functions for authentication
export async function authCheckMiddleware(req: any, ctx: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authentication required");
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  try {
    const authService = AuthService.getInstance();
    const { user, tokenData } = await authService.verifyToken(token);
    
    // Add user and tenant info to request context
    ctx.user = user;
    ctx.tenantId = tokenData.tenantId; // Fixed typo
    ctx.userRole = user.role; // Use role from verifyToken
    ctx.isAdmin = tokenData.isAdmin;
    
    return ctx.next();
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// User profile endpoint
export const getUserProfile = api(
  { expose: true, method: "GET", path: "/user/profile" },
  async function(params: UserProfileRequest): Promise<UserProfileResponse> {
    const req = params.req;
    const authHeader = req?.headers?.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Authentication required");
    }

    const token = authHeader.substring(7);
    const authService = AuthService.getInstance();
    const { user } = await authService.verifyToken(token);

    // Get user preferences
    const prisma = new PrismaClient();
    const preferences = await prisma.userPreference.findUnique({
      where: { userId: user.id },
    });
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      userName: user.userName,
      role: user.role, // Comes from verifyToken
      isAdmin: user.isAdmin,
      preferences,
    };
  }
);

// Logout from all devices endpoint
export const logoutAllDevices = api(
  { expose: true, method: "POST", path: "/auth/logout-all" },
  async function(params: LogoutAllRequest): Promise<LogoutResponse> {
    const req = params.req;
    const authHeader = req?.headers?.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Authentication required");
    }

    const token = authHeader.substring(7);
    const authService = AuthService.getInstance();
    const { user } = await authService.verifyToken(token);
    
    await authService.logoutAll(user.id);
    return { success: true };
  }
);

export type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
  LogoutAllRequest,
  UserProfileRequest,
  UserProfileResponse
};
