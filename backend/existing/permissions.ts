// modules/existing/permissions.ts
import * as encore from "encore.dev/api";
import { PrismaClient } from "@prisma/client";
import { getClient } from "./client";
import { Logger } from "../core/logger";
import { RedisService } from "../core/redis";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const redis = RedisService.getInstance();
const PERMISSIONS_CACHE_TTL = 3600;

export interface FieldPermission {
  read: boolean;
  edit: boolean;
}

export interface EntityPermissions {
  create: boolean;
  read: boolean;
  edit: boolean;
  delete: boolean;
  fields: Record<string, FieldPermission>;
}

export interface UserPermissions {
  userId: string;
  isAdmin: boolean;
  entities: Record<string, EntityPermissions>;
}

// Type definitions for EspoCRM permission structures
interface EspoAction {
  create: string;
  read: string;
  edit: string;
  delete: string;
  [key: string]: string;
}

interface EspoFieldPermission {
  read: string;
  edit: string;
  [key: string]: string;
}

export const syncRolesAndPermissions = encore.api(
  { expose: true, method: "POST", path: "/permissions/sync" },
  async (): Promise<{ success: boolean; message: string }> => {
    try {
      Logger.info("Fetching roles from EspoCRM");
      const client = getClient();
      const rolesResponse = await client.request("GET", "Role");

      if (!rolesResponse.list || !Array.isArray(rolesResponse.list)) {
        throw new Error("Invalid roles response from EspoCRM");
      }

      const roles = rolesResponse.list;
      Logger.info(`Found ${roles.length} roles in EspoCRM`);

      for (const role of roles) {
        Logger.info(`Fetching details for role ${role.name} (${role.id})`);
        const roleData = await client.request("GET", `Role/${role.id}`);

        const transformedPermissions = JSON.parse(
          JSON.stringify(transformPermissions(roleData.data || {}))
        );

        await prisma.role.upsert({
          where: { externalId: role.id },
          update: {
            name: role.name,
            permissions: transformedPermissions,
            updatedAt: new Date(),
          },
          create: {
            id: uuidv4(),
            externalId: role.id,
            name: role.name,
            permissions: transformedPermissions,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        Logger.info(`Synced permissions for role: ${role.name}`);
      }

      await redis.clearPattern("user-permissions:*");

      return {
        success: true,
        message: `Successfully synced ${roles.length} roles from EspoCRM`,
      };
    } catch (error) {
      Logger.error("Error syncing roles and permissions", { error });
      throw new Error(
        error instanceof Error
          ? `Failed to sync roles and permissions: ${error.message}`
          : "Failed to sync roles and permissions: Unknown error"
      );
    }
  }
);

export const getUserPermissions = encore.api(
  { expose: true, method: "GET", path: "/permissions/user/:userId" },
  async ({ userId }: { userId: string }): Promise<UserPermissions> => {
    const cacheKey = `user-permissions:${userId}`;

    try {
      const cached = await redis.get<UserPermissions>(cacheKey);
      if (cached) return cached;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { roles: { include: { role: true } } },
      });

      if (!user) throw new Error(`User not found: ${userId}`);

      const isAdmin = user.isAdmin;
      let combinedPermissions: Record<string, EntityPermissions> = {};

      for (const userRole of user.roles || []) {
        const perms = userRole.role?.permissions;
        if (perms && typeof perms === "object") {
          const parsed = convertJsonToPermissions(perms);
          combinedPermissions = mergePermissions(combinedPermissions, parsed);
        }
      }

      if (isAdmin) {
        combinedPermissions = applyAdminOverride(combinedPermissions);
      }

      const finalPermissions: UserPermissions = {
        userId,
        isAdmin,
        entities: combinedPermissions,
      };

      await redis.set(cacheKey, finalPermissions, PERMISSIONS_CACHE_TTL);
      return finalPermissions;
    } catch (error) {
      Logger.error(`Error fetching permissions for user ${userId}`, { error });
      throw new Error(
        error instanceof Error
          ? `Failed to fetch permissions: ${error.message}`
          : "Failed to fetch permissions: Unknown error"
      );
    }
  }
);

export const checkUserPermission = encore.api(
  { expose: true, method: "GET", path: "/permissions/check" },
  async (params: {
    userId: string;
    entityType: string;
    action: "create" | "read" | "edit" | "delete";
    fieldName?: string;
  }): Promise<{ allowed: boolean }> => {
    const { userId, entityType, action, fieldName } = params;

    try {
      const permissions = await getUserPermissions({ userId });

      if (permissions.isAdmin) return { allowed: true };

      const entityPerms = permissions.entities[entityType];
      if (!entityPerms) return { allowed: false };

      if (fieldName && (action === "read" || action === "edit")) {
        const field = entityPerms.fields[fieldName];
        return {
          allowed: field ? !!field[action] : entityPerms[action],
        };
      }

      return { allowed: entityPerms[action] };
    } catch (error) {
      Logger.error("Error checking permission", { error });
      throw new Error(
        error instanceof Error
          ? `Failed to check permission: ${error.message}`
          : "Failed to check permission"
      );
    }
  }
);

export const clearUserPermissionCache = encore.api(
  {
    expose: true,
    method: "POST",
    path: "/permissions/user/:userId/clear-cache",
  },
  async ({ userId }: { userId: string }): Promise<{ success: boolean }> => {
    await redis.delete(`user-permissions:${userId}`);
    return { success: true };
  }
);

// --- Helper Functions ---

function transformPermissions(espoPermissions: any): Record<string, EntityPermissions> {
  const result: Record<string, EntityPermissions> = {};

  if (espoPermissions.table && typeof espoPermissions.table === 'object') {
    for (const [entityType, actionsObj] of Object.entries(espoPermissions.table)) {
      // Type assertion for actions
      const actions = actionsObj as Record<string, string>;
      result[entityType] = {
        create: actions.create === "yes",
        read: ["yes", "own", "team", "all"].includes(actions.read),
        edit: ["yes", "own", "team", "all"].includes(actions.edit),
        delete: ["yes", "own", "team", "all"].includes(actions.delete),
        fields: {},
      };
    }
  }

  if (espoPermissions.fieldTable && typeof espoPermissions.fieldTable === 'object') {
    for (const [entityType, fieldsObj] of Object.entries(espoPermissions.fieldTable)) {
      if (!result[entityType]) {
        result[entityType] = {
          create: false,
          read: false,
          edit: false,
          delete: false,
          fields: {},
        };
      }

      // Type assertion for fields
      const fields = fieldsObj as Record<string, any>;
      for (const [fieldName, permsObj] of Object.entries(fields)) {
        // Type assertion for perms
        const perms = permsObj as Record<string, string>;
        result[entityType].fields[fieldName] = {
          read: perms.read === "yes",
          edit: perms.edit === "yes",
        };
      }
    }
  }

  return result;
}

function convertJsonToPermissions(json: any): Record<string, EntityPermissions> {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};

  const result: Record<string, EntityPermissions> = {};

  for (const [entity, permsObj] of Object.entries(json)) {
    if (typeof permsObj !== "object" || permsObj === null) continue;

    // Type assertion for permissions
    const perms = permsObj as Record<string, any>;
    const converted: EntityPermissions = {
      create: !!perms.create,
      read: !!perms.read,
      edit: !!perms.edit,
      delete: !!perms.delete,
      fields: {},
    };

    if (perms.fields && typeof perms.fields === "object") {
      for (const [field, fpObj] of Object.entries(perms.fields)) {
        if (typeof fpObj === "object" && fpObj !== null) {
          // Type assertion for field permissions
          const fp = fpObj as Record<string, any>;
          converted.fields[field] = {
            read: !!fp.read,
            edit: !!fp.edit,
          };
        }
      }
    }

    result[entity] = converted;
  }

  return result;
}

function mergePermissions(
  base: Record<string, EntityPermissions>,
  incoming: Record<string, EntityPermissions>
): Record<string, EntityPermissions> {
  const result = { ...base };

  for (const [entity, perms] of Object.entries(incoming)) {
    if (!result[entity]) {
      result[entity] = { ...perms };
    } else {
      result[entity].create ||= perms.create;
      result[entity].read ||= perms.read;
      result[entity].edit ||= perms.edit;
      result[entity].delete ||= perms.delete;

      for (const [field, fp] of Object.entries(perms.fields)) {
        result[entity].fields[field] ??= { read: false, edit: false };
        result[entity].fields[field].read ||= fp.read;
        result[entity].fields[field].edit ||= fp.edit;
      }
    }
  }

  return result;
}

function applyAdminOverride(perms: Record<string, EntityPermissions>): Record<string, EntityPermissions> {
  const result: Record<string, EntityPermissions> = {};

  for (const [entity, val] of Object.entries(perms)) {
    result[entity] = {
      create: true,
      read: true,
      edit: true,
      delete: true,
      fields: {},
    };

    for (const field of Object.keys(val.fields)) {
      result[entity].fields[field] = { read: true, edit: true };
    }
  }

  return result;
}