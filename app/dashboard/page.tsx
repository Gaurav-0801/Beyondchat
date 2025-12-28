import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Terminal, Database, Sparkles, Layers } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-6 py-6 flex justify-between items-center border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-sm" />
          beyondchats
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">
            Docs
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </a>
        </nav>
        <div className="flex gap-4 items-center">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
          <Button size="sm" asChild>
            <a href="/dashboard">Get started</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-6 pt-24 pb-32 overflow-hidden">
          <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-primary/20 blur-[120px] -z-10 rounded-full animate-pulse" />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-primary/10 blur-[100px] -z-10 rounded-full" />

          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-balance">
                Scale your <span className="text-primary">content</span> with AI.
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed text-pretty">
                Automatically scrape, transform, and optimize your blog articles using state-of-the-art LLMs.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="px-8" asChild>
                  <a href="/dashboard">Get started</a>
                </Button>
                <Button size="lg" variant="outline" className="px-8 border-white/10 bg-transparent">
                  Documentation <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-card border border-white/10 rounded-xl p-4 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground">article_pipeline.py</span>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex gap-3">
                    <span className="text-primary/50">01</span>
                    <span className="text-primary">scraping</span>{" "}
                    <span className="text-muted-foreground">beyondchats.com/blogs...</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-primary/50">02</span>
                    <span className="text-green-500">done</span>{" "}
                    <span className="text-muted-foreground">Found 12 articles.</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-primary/50">03</span>
                    <span className="text-primary">transforming</span>{" "}
                    <span className="text-muted-foreground">id: ax72j...</span>
                  </div>
                  <div className="flex gap-3 animate-pulse">
                    <span className="text-primary/50">04</span>
                    <span className="text-yellow-500">processing</span>{" "}
                    <span className="text-muted-foreground">Applying SEO fixes...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 bg-white/[0.02] border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Everything you need to scale content</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From scraping to transformation, manage your entire content pipeline in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-8 bg-card border-white/5 md:col-span-2 flex flex-col justify-between group hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5">
                <div>
                  <Database className="w-8 h-8 text-primary mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Postgres-powered Article Storage</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Every project comes with a dedicated database to store your original content, citations, and
                    transformation history.
                  </p>
                </div>
                <div className="mt-12 flex items-center gap-2 text-sm font-medium text-primary group-hover:translate-x-1 transition-transform cursor-pointer">
                  Learn about storage <ArrowRight className="w-4 h-4" />
                </div>
              </Card>

              <Card className="p-8 bg-card border-white/5 hover:border-white/10 transition-all hover:shadow-lg">
                <Sparkles className="w-8 h-8 text-yellow-500 mb-6" />
                <h3 className="text-xl font-bold mb-4">AI Transformation</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Powered by GPT-4o to rewrite, optimize, and cite your articles automatically.
                </p>
              </Card>

              <Card className="p-8 bg-card border-white/5 hover:border-white/10 transition-all hover:shadow-lg">
                <Layers className="w-8 h-8 text-blue-500 mb-6" />
                <h3 className="text-xl font-bold mb-4">Version Control</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Compare original and updated versions with visual diffs and sentiment metrics.
                </p>
              </Card>

              <Card className="p-8 bg-card border-white/5 md:col-span-2 flex items-center gap-8 hover:border-white/10 transition-all">
                <div className="flex-1">
                  <Terminal className="w-8 h-8 text-primary mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Automated Workflows</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Trigger scrapes via API or scheduled cron jobs. Scale your content engine without lifting a finger.
                  </p>
                </div>
                <div className="hidden lg:block w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-12 border-t border-white/5 text-center text-sm text-muted-foreground">
        © 2025 beyondchats. Built with Next.js, TypeScript, and Vercel AI SDK.
      </footer>
    </div>
  )
}
