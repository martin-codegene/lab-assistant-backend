import { IUserRepository } from "@domain/repositories";
import { User, UpdateUserInput, UserRole, PlanType } from "@domain/user";
import { Pagination, PaginatedResult } from "@shared/types";
import { prisma } from "@infrastructure/database/prisma-client";
import bcrypt from "bcryptjs";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    return user ? this.mapToDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    return user ? this.mapToDomain(user) : null;
  }

  async save(user: User): Promise<void> {
    await prisma.user.upsert({
      where: { id: user.id },
      create: this.mapToPrisma(user),
      update: this.mapToPrisma(user),
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findMany(pagination?: Pagination, filters?: { role?: UserRole; plan?: PlanType }): Promise<PaginatedResult<User>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    
    const where = {
      ...(filters?.role && { role: filters.role }),
      ...(filters?.plan && { plan: filters.plan }),
    };
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    
    return {
      data: users.map(user => this.mapToDomain(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Copy all fields except password
    if (input.name !== undefined) updateData.name = input.name;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.plan !== undefined) updateData.plan = input.plan;
    if (input.lastLoginAt !== undefined) updateData.lastLoginAt = input.lastLoginAt;

    // If password is being updated, hash it
    if (input.password) {
      const hashedPassword = await bcrypt.hash(input.password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    
    return this.mapToDomain(updatedUser);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
  }

  private mapToDomain(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password, // Hashed password
      name: prismaUser.name || undefined,
      avatarUrl: prismaUser.avatarUrl || undefined,
      role: prismaUser.role,
      plan: prismaUser.plan,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      lastLoginAt: prismaUser.lastLoginAt || undefined,
    };
  }

  private mapToPrisma(user: User): any {
    return {
      id: user.id,
      email: user.email,
      password: user.password, // Already hashed
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      plan: user.plan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}