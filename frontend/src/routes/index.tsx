import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { api, ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      await api.get("/auth/me");
      throw redirect({ to: "/dashboard" });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        return;
      }
      throw err;
    }
  },
  component: Index,
});

function Index() {
  return (
    <div className="grid min-h-svh">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md text-xs font-bold">
              P
            </div>
            PitangReembolsa
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
