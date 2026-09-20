import { NextResponse } from "next/server";
import { HttpError } from "./authz";
import { ZodError } from "zod";

export function apiRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Invalid input", details: err.issues },
          { status: 400 },
        );
      }
      console.error(err);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  };
}
