import { Pagination, PaginatedResult, ApiResponse } from "@shared/types";
import { IUserRepository } from "@domain/repositories";
import { UserEntity, CreateUserInput, UpdateUserInput, UserRole, PlanType, LoginCredentials } from "@domain/user";

export class UserUseCases {
  constructor(private userRepository: IUserRepository) {}

  async createUser(input: CreateUserInput): Promise<ApiResponse<UserEntity>> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser) {
        return {
          success: false,
          error: "User with this email already exists",
        };
      }

      // Create user entity with hashed password
      const user = await UserEntity.create(input);
      
      // Validate
      const validation = user.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // Save to repository
      await this.userRepository.save(user);

      return {
        success: true,
        data: user,
        message: "User created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user",
      };
    }
  }

  async getUserById(id: string): Promise<ApiResponse<UserEntity>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      return {
        success: true,
        data: new UserEntity(user),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get user",
      };
    }
  }

  async getUserByEmail(email: string): Promise<ApiResponse<UserEntity>> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      return {
        success: true,
        data: new UserEntity(user),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get user",
      };
    }
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<ApiResponse<UserEntity>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      const userEntity = new UserEntity(user);
      await userEntity.update(input);

      // Validate
      const validation = userEntity.validate();
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      const updatedUser = await this.userRepository.update(id, input);

      return {
        success: true,
        data: new UserEntity(updatedUser),
        message: "User updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update user",
      };
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      await this.userRepository.delete(id);

      return {
        success: true,
        data: undefined,
        message: "User deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete user",
      };
    }
  }

  async listUsers(pagination?: Pagination, filters?: { role?: UserRole; plan?: PlanType }): Promise<ApiResponse<PaginatedResult<UserEntity>>> {
    try {
      const result = await this.userRepository.findMany(pagination, filters);

      const userEntities = result.data.map(user => new UserEntity(user));

      return {
        success: true,
        data: {
          ...result,
          data: userEntities,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list users",
      };
    }
  }

  async recordUserLogin(id: string): Promise<ApiResponse<UserEntity>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      const userEntity = new UserEntity(user);
      userEntity.recordLogin();

      // Update last login time
      const updatedUser = await this.userRepository.update(id, { lastLoginAt: userEntity.lastLoginAt });

      return {
        success: true,
        data: new UserEntity(updatedUser),
        message: "Login recorded successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record login",
      };
    }
  }

  async authenticate(credentials: LoginCredentials): Promise<ApiResponse<UserEntity>> {
    try {
      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user) {
        return {
          success: false,
          error: "Invalid credentials",
        };
      }

      const userEntity = new UserEntity(user);
      const isValidPassword = await userEntity.verifyPassword(credentials.password);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: "Invalid credentials",
        };
      }

      // Record login
      userEntity.recordLogin();
      await this.userRepository.update(user.id, { lastLoginAt: userEntity.lastLoginAt });

      return {
        success: true,
        data: userEntity,
        message: "Login successful",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      };
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      const userEntity = new UserEntity(user);
      const isValidPassword = await userEntity.verifyPassword(currentPassword);
      
      if (!isValidPassword) {
        return {
          success: false,
          error: "Current password is incorrect",
        };
      }

      // Update password
      await userEntity.update({ password: newPassword });
      await this.userRepository.updatePassword(userId, newPassword);
      
      return {
        success: true,
        message: "Password updated successfully",
        data:undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to change password",
      };
    }
  }
}