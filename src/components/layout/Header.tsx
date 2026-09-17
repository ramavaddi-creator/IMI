import React, { useState } from 'react';
import type { ActiveScreen, UserRole } from '../../types';
import { Home, Inbox, FileText, CheckSquare, TrendingUp, Search, UserCheck, Menu, X, Smartphone, Laptop, HelpCircle, Palette, Bot } from 'lucide-react';

interface HeaderProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  inboxPendingCount: number;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onNavigate,
  currentUserRole,
  onRoleChange,
  isMobilePreview,
  onToggleMobilePreview,
  inboxPendingCount,
  onOpenHelp,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home_today', label: 'Home / Today', icon: <Home className="w-4 h-4" /> },
    { id: 'inbox', label: 'Inbox & Triage', icon: <Inbox className="w-4 h-4" />, badge: inboxPendingCount },
    { id: 'record_workspace', label: 'Record Workspace', icon: <FileText className="w-4 h-4" /> },
    { id: 'decision_review', label: 'Decision Review', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'outcome_review', label: 'Outcome Review', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'ask_system', label: 'Ask the System', icon: <Search className="w-4 h-4" /> },
  ];

  const handleNavClick = (screen: ActiveScreen) => {
    onNavigate(screen);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-900 text-zinc-100 border-b border-zinc-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-zinc-800 border border-zinc-700 font-mono font-bold text-sm tracking-wider text-zinc-100">
              IMI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white font-sans">Iddav Marketing Intelligence</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Operations Console
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">Single-Tenant Decision & Learning Workspace</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleMobilePreview}
              title={isMobilePreview ? 'Switch to standard desktop view' : 'Switch to mobile test frame'}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                isMobilePreview
                  ? 'bg-zinc-100 text-zinc-900 border-white font-semibold'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              {isMobilePreview ? <Laptop className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>{isMobilePreview ? 'Desktop Mode' : 'Mobile Viewport'}</span>
            </button>

            <div className="flex items-center gap-1 bg-zinc-800/60 border border-zinc-700 px-1.5 py-1 rounded">
              <span className="hidden md:inline text-[10px] font-mono uppercase text-zinc-500 pl-1 pr-0.5">Create Poster:</span>
              <button
                onClick={() => window.open('https://claude.ai/artifact/1F2eueautfXN342axz8zpm', '_blank', 'noopener,noreferrer')}
                title="Open the Iddav Perspective Poster Studio (Claude) in a new tab"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Claude</span>
              </button>
              <button
                onClick={() => window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')}
                title="Open ChatGPT in a new tab — uses your account's own history and memory"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>ChatGPT</span>
              </button>
            </div>

            <button
              onClick={onOpenHelp}
              title="How to use IMI"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Help</span>
            </button>

            <div className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700 px-2 py-1 rounded text-xs font-mono">
              <UserCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <label htmlFor="role-switcher" className="text-[11px] text-zinc-400 hidden lg:inline">
                Role:
              </label>
              <select
                id="role-switcher"
                value={currentUserRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-zinc-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
              >
                <option value="owner_admin" className="bg-zinc-900 text-zinc-100">
                  Owner/Admin (Founder - Class A Approver)
                </option>
                <option value="research_editor" className="bg-zinc-900 text-zinc-100">
                  Research Editor
                </option>
                <option value="property_contributor" className="bg-zinc-900 text-zinc-100">
                  Property Contributor (Field Mobile)
                </option>
                <option value="reservations_sales" className="bg-zinc-900 text-zinc-100">
                  Reservations-Sales Desk
                </option>
              </select>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1 border-t border-zinc-800/80 py-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium font-mono rounded transition-colors whitespace-nowrap relative ${
                  isActive ? 'bg-zinc-100 text-zinc-950 font-bold shadow-xs' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
                      isActive ? 'bg-zinc-900 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {mobileMenuOpen && (
        <nav aria-label="Mobile" className="md:hidden bg-zinc-950 border-t border-zinc-800 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-mono rounded ${
                  isActive ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
