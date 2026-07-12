import { Bell, Menu, Search } from "lucide-react";
import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";

type DashboardPageShellProps = {
  activePage: string;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  onNavigate: (page: string) => void;
  children: ReactNode;
  mainClassName?: string;
  showToolbar?: boolean;
  rootClassName?: string;
};

type DashboardPageHeaderProps = {
  title: string;
  subtitle: string;
  onOpenMenu: () => void;
  action?: ReactNode;
};

export function DashboardPageShell({
  activePage,
  menuOpen,
  onMenuOpenChange,
  onNavigate,
  children,
  mainClassName = "px-4 py-5 sm:px-6 xl:px-8",
  showToolbar = false,
  rootClassName = "",
}: DashboardPageShellProps) {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const resolvedMenuOpen = menuOpen ?? internalMenuOpen;
  const setMenuOpen = onMenuOpenChange ?? setInternalMenuOpen;

  return (
    <div
      className={`flex min-h-screen bg-[#faf7f0] font-sans text-[#103a31] ${rootClassName}`}
    >
      {resolvedMenuOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-40 h-dvh transition-transform lg:sticky lg:top-0 ${
          resolvedMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar
          active={activePage}
          onSelect={(page) => {
            setMenuOpen(false);
            onNavigate(page);
          }}
        />
      </div>

      <main className={`min-w-0 flex-1 overflow-visible ${mainClassName}`}>
        {showToolbar ? (
          <DashboardToolbar onOpenMenu={() => setMenuOpen(true)} />
        ) : null}
        {children}
      </main>
    </div>
  );
}

function DashboardToolbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="mb-[18px] flex items-center justify-end gap-[18px]">
      <button
        type="button"
        aria-label="Open navigation"
        className="mr-auto rounded-lg border border-[#d9d0c1] p-2 lg:hidden"
        onClick={onOpenMenu}
      >
        <Menu />
      </button>

      <label className="hidden min-w-[420px] items-center gap-2.5 rounded-lg border border-[#d9d2c7] bg-white px-3.5 py-2.5 md:flex">
        <Search size={19} />
        <input
          className="w-full border-0 bg-transparent outline-none"
          placeholder="Search meals, ingredients, or recipes"
        />
      </label>

      <button type="button" aria-label="Notifications">
        <Bell />
      </button>

      <span className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#9a6a2c] text-white">
        A
      </span>
    </div>
  );
}

export function DashboardPageHeader({
  title,
  subtitle,
  onOpenMenu,
  action,
}: DashboardPageHeaderProps) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
      <div className="flex gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          className="mt-2 rounded-lg border border-[#d9d0c1] p-2 lg:hidden"
          onClick={onOpenMenu}
        >
          <Menu />
        </button>

        <div>
          <h1 className="m-0 font-serif text-4xl font-normal leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[#63645f]">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="hidden w-[350px] items-center gap-3 rounded-xl border border-[#ded5c5] px-4 py-3 text-[#72736d] md:flex">
          <Search size={19} />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search meals, ingredients, or recipes"
          />
        </label>

        <button type="button" aria-label="Notifications">
          <Bell size={23} />
        </button>

        <button
          type="button"
          aria-label="Open profile"
          className="grid h-11 w-11 place-items-center rounded-full bg-[#ad7b31] text-white"
        >
          A
        </button>

        {action}
      </div>
    </header>
  );
}
