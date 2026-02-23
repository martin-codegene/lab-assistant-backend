import { IUserRepository } from "@domain/repositories";
import { User } from "@domain/user";
import { Pagination, PaginatedResult } from "@shared/types";

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async findMany(pagination?: Pagination, filters?: { role?: string; plan?: string }): Promise<PaginatedResult<User>> {
    let users = Array.from(this.users.values());
    
    // Apply filters
    if (filters?.role) {
      users = users.filter(user => user.role === filters.role);
    }
    if (filters?.plan) {
      users = users.filter(user => user.plan === filters.plan);
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    return {
      data: paginatedUsers,
      total: users.length,
      page,
      limit,
      totalPages: Math.ceil(users.length / limit)
    };
  }

  async update(id: string, input: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...input, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}