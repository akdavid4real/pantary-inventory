import { useState } from "react";
import { RefreshCw, ShoppingBasket, X } from "lucide-react";
import { DashboardPageShell } from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";
import { routes, ScreenProps } from "../../types/navigation";

export function ShoppingListGenerator({ onNavigate }: ScreenProps) {
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const generate=async()=>{setBusy(true);setError("");try{const list=await api<{id:string}>("/shopping-list/generate/from-meal-plan",{method:"POST",body:"{}"});onNavigate(routes.shoppingList(list.id));}catch(reason){setError(reason instanceof Error?reason.message:"Could not refresh the list.");}finally{setBusy(false);}};
  return <DashboardPageShell activePage="Grocery" onNavigate={onNavigate} showToolbar><div className="mx-auto flex min-h-[70vh] max-w-6xl items-start justify-end p-4 sm:p-8"><section className="w-full max-w-md rounded-2xl border bg-[#fffdf8] p-6 shadow-xl"><div className="flex justify-between"><div><span className="text-xs uppercase tracking-widest text-[#68736d]">Meal plan → Grocery</span><h1 className="mt-1 font-serif text-3xl">Refresh shopping list</h1></div><button onClick={()=>onNavigate("Grocery")}><X/></button></div><div className="my-6 rounded-xl bg-[#edf4ef] p-5"><ShoppingBasket className="mb-3"/><h2 className="font-serif text-xl">One active list</h2><p className="mt-2 text-sm text-[#626a65]">We’ll compare this week’s local recipes with Pantry, merge missing ingredients into your current list, preserve manual items, and keep eligible bought or skipped states.</p></div><p className="text-xs text-amber-800">External meal recipes are excluded until their ingredient data is supported.</p>{error?<p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>:null}<button onClick={()=>void generate()} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#07513f] p-3 text-sm text-white disabled:opacity-50"><RefreshCw size={16} className={busy?"animate-spin":""}/>{busy?"Refreshing…":"Refresh from this week"}</button></section></div></DashboardPageShell>;
}
