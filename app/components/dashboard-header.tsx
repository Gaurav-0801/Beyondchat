import { Button } from "@/components/ui/button"
import { Plus, LayoutDashboard, Settings, FileText } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-sm shadow-[0_0_15px_rgba(88,51,255,0.4)]" />
          beyondchats
        </div>
        <nav className="flex gap-6 text-sm font-medium">
          <a href="#" className="text-foreground flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" /> Articles
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" /> Settings
          </a>
        </nav>
      </div>
      <div className="flex gap-3">
        <Button size="sm" variant="outline" className="border-white/10 bg-transparent">
          Docs
        </Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> New Scrape
        </Button>
      </div>
    </header>
  )
}
