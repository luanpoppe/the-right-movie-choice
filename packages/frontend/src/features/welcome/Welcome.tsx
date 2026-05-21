import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Form } from "./components/Form";

interface WelcomeProps {
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function Welcome({ isLoading, handleSubmit }: WelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full space-y-12">
        <Hero />

        <Features />

        <Form isLoading={isLoading} handleSubmit={handleSubmit} />
      </div>
    </div>
  );
}
