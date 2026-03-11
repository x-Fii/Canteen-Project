import React, { useState } from "react";
import { UserRole, createUserCallable } from "@/lib/firebase-new";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Validation schema for new user
const createUserSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["admin", "content_manager"]),
});

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps): React.ReactElement | null {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("content_manager");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationError(null);

    try {
      // Validate input using Zod schema
      const validated = createUserSchema.parse({
        email,
        password,
        role,
      });

      // Use cloud function to create user with custom claims
      // This ensures consistency with the rest of the system
      const result = await createUserCallable({
        email: validated.email,
        password: validated.password,
        role: validated.role,
      });

      if (result.data.success) {
        toast.success(`User created successfully as ${result.data.role}!`);
        
        // Reset form and close
        setEmail("");
        setPassword("");
        setRole("content_manager");
        onSuccess();
        onClose();
      } else {
        throw new Error("Failed to create user");
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message || "Validation error";
        setValidationError(message);
        toast.error(message);
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to create user";
        console.error("Error creating user:", error);
        setValidationError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail("");
      setPassword("");
      setRole("content_manager");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg lantern-shadow p-6 border-2 border-accent/20 w-full max-w-md">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          Create New User
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="new-user-email" className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <input
              id="new-user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="user@example.com"
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="new-user-password" className="block text-sm font-medium text-muted-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="new-user-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Min 8 characters"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role Dropdown */}
          <div>
            <label htmlFor="new-user-role" className="block text-sm font-medium text-muted-foreground mb-1">
              Role
            </label>
            <select
              id="new-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            >
              <option value="content_manager">Content Manager</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Admin has full access. Content Manager can only manage menu items.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="bg-muted hover:bg-muted/80 text-muted-foreground font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
