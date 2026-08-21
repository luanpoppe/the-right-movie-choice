# Login Google
> Atualizado em 2026-08-21 · fontes: `AuthenticateWithGoogleUseCase`, `googleAuthController`, `GoogleSignInButton`, `GOOGLE_CLIENT_ID`

## O que é
Login/cadastro com Google Identity: o cliente manda um ID token; o backend verifica, garante e-mail verificado e unifica a conta pelo e-mail.

## Como funciona
- `POST /auth/google` com o token do `@react-oauth/google` (`GoogleOAuthProvider` no `Root`, `GoogleSignInButton`).
- Use case valida o token contra `GOOGLE_CLIENT_ID`; e-mail não verificado → `GoogleEmailNotVerifiedException`.
- Se já existe usuário com aquele e-mail, vincula `googleId`; senão cria. Depois `AuthSessionFacade.issue` (mesmo cookie/JWT do login nativo).
- Factory: `MakeAuthenticateWithGoogleUseCaseFactory`. Docs: `GoogleAuthDocs`.

## Decisões e porquês
- Unificação por e-mail — evita duas contas (Google vs senha) para a mesma pessoa.
- Verificar e-mail no token — não aceitar identidade Google sem e-mail confiável.
- Mesmo contrato de tokens do login nativo — o frontend trata uma sessão só.

## Notas
Client ID precisa bater no backend (`GOOGLE_CLIENT_ID`) e no frontend (`VITE_GOOGLE_CLIENT_ID`).
