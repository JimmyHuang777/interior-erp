import { auth } from "@/auth";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new HttpError(401, "Unauthorized");
  }
  return session.user as { id: string; role: string; name?: string | null };
}

export async function requireRole(roles: string[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden");
  }
  return user;
}
