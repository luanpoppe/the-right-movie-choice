import { Send, Film, Sparkles } from "lucide-react";

export function Features() {
  const contents = [
    {
      Icon: () => <Sparkles className="w-6 h-6 text-primary" />,
      title: "AI-Powered",
      description: "Smart recommendations based on your preferences and mood",
    },
    {
      Icon: () => <Film className="w-6 h-6 text-accent" />,
      title: "Curated Selection",
      description: "Three carefully chosen movies with detailed information",
    },
    {
      Icon: () => <Send className="w-6 h-6 text-primary" />,
      title: "Interactive Chat",
      description: "Refine your search with follow-up questions anytime",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {contents.map(({ description, Icon, title }) => (
        <div
          key={title}
          className="rounded-2xl bg-card/50 border border-border/50 p-6 space-y-3 backdrop-blur-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon />
          </div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      ))}
    </div>
  );
}
