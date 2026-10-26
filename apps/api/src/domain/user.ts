import { BaseEntity } from "@shared/types";
import bcrypt from "bcryptjs";

export enum UserRole {
  RESEARCHER = "RESEARCHER",
  LAB_MANAGER = "LAB_MANAGER",
  ADMIN = "ADMIN"
}

export enum PlanType {
  FREE = "FREE",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE"
}

export interface User extends BaseEntity {
  email: string;
  password: string; // Hashed password
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  plan: PlanType;
  lastLoginAt?: Date;
}

// Public user info (without password)
export interface UserPublic extends BaseEntity {
  email: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  plan: PlanType;
  lastLoginAt?: Date;
}

export interface CreateUserInput {
  email: string;
  password: string; // Plain text password
  name?: string;
  avatarUrl?: string;
  role?: UserRole;
  plan?: PlanType;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  role?: UserRole;
  plan?: PlanType;
  password?: string; // Plain text password for update
  lastLoginAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class UserEntity implements User {
  id: string;
  email: string;
  password: string;
  name?: string;
  avatarUrl?: string;
  role: UserRole;
  plan: PlanType;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;

  constructor(data: User) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.avatarUrl = data.avatarUrl;
    this.role = data.role;
    this.plan = data.plan;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastLoginAt = data.lastLoginAt;
  }

  static async create(input: CreateUserInput): Promise<UserEntity> {
    const now = new Date();
    const hashedPassword = await bcrypt.hash(input.password, 10);
    
    return new UserEntity({
      id: crypto.randomUUID(),
      email: input.email,
      password: hashedPassword,
      name: input.name,
      avatarUrl: input.avatarUrl,
      role: input.role || UserRole.RESEARCHER,
      plan: input.plan || PlanType.FREE,
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(input: UpdateUserInput): Promise<void> {
    if (input.name !== undefined) this.name = input.name;
    if (input.avatarUrl !== undefined) this.avatarUrl = input.avatarUrl;
    if (input.role !== undefined) this.role = input.role;
    if (input.plan !== undefined) this.plan = input.plan;
    if (input.password !== undefined) {
      this.password = await bcrypt.hash(input.password, 10);
    }
    this.updatedAt = new Date();
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  recordLogin(): void {
    this.lastLoginAt = new Date();
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.email || !this.email.includes("@")) {
      errors.push("Invalid email address");
    }

    if (this.name && this.name.length > 100) {
      errors.push("Name must be less than 100 characters");
    }

    if (!this.password || this.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): Omit<User, "password"> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}