import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function GuestLockBanner() {
  return (
    <div
      role="status"
      className="rounded-2xl border border-border/50 bg-card/80 p-4 shadow-lg space-y-3"
    >
      <p className="text-sm text-foreground">
        Você chegou ao limite de recomendações sem conta. Crie uma conta para
        continuar usando o chat.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" asChild>
          <Link to="/register">Criar conta</Link>
        </Button>
        <Link
          to="/login"
          className="text-sm text-primary hover:underline underline-offset-4"
        >
          Já tem conta? Entrar
        </Link>
      </div>
    </div>
  );
}
