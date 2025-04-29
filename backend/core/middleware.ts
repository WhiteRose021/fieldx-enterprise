// services/core/middleware.ts
import { AuthService } from "./auth";
import { Logger } from "./logger";
import { getUserClient } from "../existing/client";

// Define types for request, response, and next function
// Updated Response type to match the actual HTTP response interface
type Request = {
  headers: Record<string, string | undefined>;
  method?: string;
  url?: string;
};

type Response = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => Response;
  // Update the end() method to accept optional data argument
  end: (data?: string | Buffer) => void;
};

type NextFunction = () => Promise<any>;

// CORS middleware function
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle OPTIONS requests immediately
  if (req.method === "OPTIONS") {
    Logger.info("Handled OPTIONS preflight request", { 
      path: req.url,
      origin: req.headers.origin || 'unknown'
    });
    res.status(200).end();
    return;
  }

  // Continue to the next middleware or handler
  return next();
}

// Authentication middleware - makes user info available in params.req
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth check for OPTIONS requests
  if (req.method === "OPTIONS") {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    Logger.warn("Missing or invalid Authorization header");
    // Now end() accepts string argument as defined in the type
    res.status(401).end(JSON.stringify({ error: "Authentication required" }));
    return;
  }

  const token = authHeader.substring(7);
  try {
    const authService = AuthService.getInstance();
    const { user } = await authService.verifyToken(token);

    // Store user info in request for API handlers
    (req as any).user = user;
    
    Logger.info("Authenticated request", {
      userId: user.id,
      endpoint: req.url,
    });

    return next();
  } catch (error: any) {
    Logger.error("Token verification failed", { error: error.message });
    // Now end() accepts string argument as defined in the type
    res.status(401).end(JSON.stringify({ error: "Authentication failed" }));
    return;
  }
}

// Enhanced auth check middleware that prepares user-specific EspoCRM client
export async function authCheckMiddleware(req: Request, ctx: any) {
  // Skip auth check for OPTIONS requests
  if (req.method === "OPTIONS") {
    return ctx.next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    Logger.warn("Missing or invalid Authorization header");
    throw new Error("Authentication required");
  }

  const token = authHeader.substring(7);
  try {
    const authService = AuthService.getInstance();
    const { user, tokenData } = await authService.verifyToken(token);

    // Add user and tenant info to request context
    ctx.user = user;
    ctx.tenantId = tokenData.tenantId;
    ctx.userRole = tokenData.role;
    ctx.isAdmin = tokenData.isAdmin;
    
    // Add user ID for EspoCRM operations
    ctx.userId = user.id;
    
    // Setup user-specific client getter function
    ctx.getUserClient = () => {
      return getUserClient(user.id);
    };

    Logger.info("Authenticated request", {
      userId: user.id,
      tenantId: tokenData.tenantId,
      endpoint: req.url,
    });

    return ctx.next();
  } catch (error: any) {
    Logger.error("Token verification failed", { error: error.message });
    throw new Error("Authentication failed");
  }
}

// Middleware to ensure a user has permission for certain operations
export async function permissionCheckMiddleware(
  req: Request,
  ctx: any,
  requiredPermissions: {
    entity: string;
    action: 'create' | 'read' | 'edit' | 'delete';
    field?: string;
  }
) {
  // First ensure user is authenticated
  if (!ctx.user) {
    throw new Error("Authentication required");
  }

  // Admin users bypass permission checks
  if (ctx.isAdmin) {
    return ctx.next();
  }

  try {
    // Check permission (This would typically use the permissions system)
    const isAllowed = await checkUserPermission(
      ctx.user.id,
      requiredPermissions.entity,
      requiredPermissions.action,
      requiredPermissions.field
    );

    if (!isAllowed) {
      Logger.warn("Permission denied", {
        userId: ctx.user.id,
        entity: requiredPermissions.entity,
        action: requiredPermissions.action,
        field: requiredPermissions.field,
      });
      throw new Error("Permission denied");
    }

    return ctx.next();
  } catch (error: any) {
    if (error.message === "Permission denied") {
      throw error;
    }
    Logger.error("Error checking permissions", { error: error.message });
    throw new Error("Failed to check permissions");
  }
}

// Helper function to check user permission
async function checkUserPermission(
  userId: string,
  entity: string,
  action: string,
  field?: string
): Promise<boolean> {
  // This is a simple placeholder - in a real app, you'd check against your permissions system
  // For this example, we'll just return true - implement your actual permission logic here
  return true;
}