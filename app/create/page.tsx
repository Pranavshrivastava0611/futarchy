import { Header } from "../components/Header";
import { QuestionForm } from "../components/QuestionForm";

export default function CreatePage() {
  return (
    <div className="min-h-screen w-full text-white relative overflow-x-hidden"
      style={{
        background:
          `radial-gradient(1200px 600px at 50% -200px, rgba(120,119,198,0.23), transparent),
           radial-gradient(800px 400px at 120% -200px,rgba(236,72,153,0.16),transparent),
           radial-gradient(800px 400px at -20% -200px,rgba(99,102,241,0.10),transparent),
           repeating-linear-gradient(0deg, rgba(143,139,236,0.12), rgba(143,139,236,0.12) 1px, transparent 1px, transparent 40px),
           repeating-linear-gradient(90deg, rgba(143,139,236,0.12), rgba(143,139,236,0.12) 1px, transparent 1px, transparent 40px)`
      }}
    >
      <Header />
      <section className="w-full max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">Create a Prediction Market</h2>
        <QuestionForm />
      </section>
    </div>
  );
}
