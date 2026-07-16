import { ChangeEvent, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  ImagePlus,
  LoaderCircle,
  ScanSearch,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "../../components/dashboard/DashboardPageShell";
import { api } from "../../services/api";

type FoodAnalysis = {
  isFood: boolean;
  dishName: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  likelyIngredients: string[];
  servingDescription: string;
  estimatedNutrition: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  allergenWarnings: string[];
  observations: string[];
  answer: string;
  model: string;
  disclaimer: string;
};

type PreparedPhoto = {
  dataUrl: string;
  base64: string;
  contentType: "image/jpeg";
};

const panel = "rounded-2xl border border-[#ded5c5] bg-[#fffdf8] shadow-sm";

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be opened."));
    image.src = dataUrl;
  });
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("This image could not be read."));
    reader.readAsDataURL(file);
  });
}

async function renderJpeg(image: HTMLImageElement, maxDimension: number, quality: number) {
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Your browser could not compress this image.")), "image/jpeg", quality);
  });
}

async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP food photo.");
  }
  const original = await readFile(file);
  const image = await loadImage(original);
  let blob = await renderJpeg(image, 1600, 0.82);
  if (blob.size > 2_500_000) blob = await renderJpeg(image, 1100, 0.7);
  if (blob.size > 2_500_000) throw new Error("This photo is still too large. Try taking it at a lower camera resolution.");
  const dataUrl = await readFile(new File([blob], "food-photo.jpg", { type: "image/jpeg" }));
  return {
    dataUrl,
    base64: dataUrl.split(",")[1],
    contentType: "image/jpeg",
  };
}

export function FoodScan({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPreparing(true);
    setError("");
    setAnalysis(null);
    try {
      setPhoto(await preparePhoto(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not prepare this photo.");
    } finally {
      setPreparing(false);
    }
  };

  const analyze = async () => {
    if (!photo) return;
    setBusy(true);
    setError("");
    setAnalysis(null);
    try {
      setAnalysis(await api<FoodAnalysis>("/food-analysis/photo", {
        method: "POST",
        body: JSON.stringify({
          contentType: photo.contentType,
          base64: photo.base64,
          question: question.trim() || undefined,
        }),
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gemini could not analyze this food photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardPageShell
      activePage="Food Scan"
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      onNavigate={onNavigate}
      mainClassName="px-4 py-5 sm:px-7 xl:px-8"
    >
      <DashboardPageHeader
        title="AI food scanner"
        subtitle="Take a food photo, ask a question, and let Gemini examine what is visible."
        onOpenMenu={() => setMenuOpen(true)}
        action={
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#ff5f4b] px-5 py-3 text-sm text-white">
            <Camera size={18} /> Take or upload photo
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) => void choosePhoto(event)}
              className="sr-only"
            />
          </label>
        }
      />

      {error ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertTriangle className="mt-0.5 shrink-0" size={17} /> <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,.9fr)_minmax(0,1.1fr)]">
        <section className={`${panel} h-fit p-5`}>
          <div className="relative grid min-h-[360px] place-items-center overflow-hidden rounded-xl border border-dashed border-[#cfc5b4] bg-[#f5f1e8]">
            {photo ? (
              <img src={photo.dataUrl} alt="Food selected for analysis" className="max-h-[520px] w-full object-contain" />
            ) : (
              <div className="max-w-sm p-8 text-center text-[#5f6862]">
                {preparing ? <LoaderCircle className="mx-auto animate-spin text-[#07513f]" size={38} /> : <ImagePlus className="mx-auto text-[#07513f]" size={42} />}
                <h2 className="mt-4 font-serif text-2xl text-[#092e27]">{preparing ? "Preparing your photo" : "Show Gemini your food"}</h2>
                <p className="mt-2 text-sm leading-6">On mobile, this opens your camera. On desktop, choose a clear photo with the full serving visible.</p>
                {!preparing ? (
                  <button type="button" onClick={() => fileInput.current?.click()} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#07513f] px-4 py-2 text-sm text-[#07513f]"><Upload size={16} /> Choose photo</button>
                ) : null}
              </div>
            )}
          </div>

          {photo ? (
            <button type="button" onClick={() => fileInput.current?.click()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm"><Camera size={16} /> Retake or replace</button>
          ) : null}

          <label className="mt-5 block text-sm font-medium text-[#1e3932]">
            What do you want to know? <span className="font-normal text-[#777]">(optional)</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={300}
              rows={3}
              placeholder="For example: Is this likely jollof rice, and what allergens might it contain?"
              className="mt-2 w-full resize-none rounded-xl border bg-white p-3 text-sm font-normal outline-none focus:border-[#07513f]"
            />
          </label>
          <button
            type="button"
            onClick={() => void analyze()}
            disabled={!photo || busy || preparing}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#07513f] px-5 py-3.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="animate-spin" size={18} /> : <ScanSearch size={18} />}
            {busy ? "Gemini is examining the photo..." : "Analyze this food"}
          </button>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#747872]">The app compresses the image before sending it and does not save it to Pantry-to-Plate storage.</p>
        </section>

        <section className={`${panel} min-h-[520px] p-5 sm:p-6`} aria-live="polite">
          {!analysis && !busy ? (
            <div className="grid min-h-[470px] place-items-center text-center">
              <div className="max-w-md">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e8f2eb] text-[#07513f]"><Sparkles size={27} /></span>
                <h2 className="mt-5 font-serif text-3xl text-[#092e27]">Your analysis appears here</h2>
                <p className="mt-2 text-sm leading-6 text-[#68706a]">Gemini will identify the likely dish, visible ingredients, estimated serving nutrition, possible allergens, and answer your question.</p>
              </div>
            </div>
          ) : null}
          {busy ? (
            <div className="grid min-h-[470px] place-items-center text-center">
              <div><LoaderCircle className="mx-auto animate-spin text-[#07513f]" size={40} /><h2 className="mt-5 font-serif text-2xl">Looking closely at your food</h2><p className="mt-2 text-sm text-[#68706a]">Checking the visible dish, portion, ingredients, and your saved food preferences.</p></div>
            </div>
          ) : null}
          {analysis ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#8a6a22]">{analysis.confidence.toLowerCase()} confidence</span>
                  <h2 className="mt-1 font-serif text-3xl text-[#092e27]">{analysis.dishName}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#68706a]">{analysis.description}</p>
                </div>
                <span className="rounded-full bg-[#e8f2eb] px-3 py-1 text-xs text-[#07513f]">Gemini vision</span>
              </div>

              {!analysis.isFood ? (
                <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Gemini could not confirm that this image contains food. Try a closer, brighter photo.</p>
              ) : (
                <>
                  <p className="mt-5 text-xs text-[#68706a]">Estimated for: <strong>{analysis.servingDescription}</strong></p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ["Calories", analysis.estimatedNutrition.calories, "kcal"],
                      ["Protein", analysis.estimatedNutrition.proteinGrams, "g"],
                      ["Carbs", analysis.estimatedNutrition.carbsGrams, "g"],
                      ["Fat", analysis.estimatedNutrition.fatGrams, "g"],
                    ].map(([label, value, unit]) => (
                      <div key={String(label)} className="rounded-xl bg-[#f2f5ed] p-3 text-center"><strong className="block font-serif text-2xl font-normal text-[#092e27]">{value}</strong><span className="text-[10px] text-[#66706a]">{label} · {unit}</span></div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold text-[#1e3932]">Likely ingredients</h3>
                    <div className="mt-2 flex flex-wrap gap-2">{analysis.likelyIngredients.map((ingredient) => <span key={ingredient} className="rounded-full border bg-white px-3 py-1 text-xs">{ingredient}</span>)}</div>
                  </div>
                  {analysis.allergenWarnings.length ? (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900"><AlertTriangle size={16} /> Possible allergens</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-800">{analysis.allergenWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
                  ) : null}
                </>
              )}
              <div className="mt-5 rounded-xl bg-[#edf4ef] p-4"><h3 className="text-sm font-semibold text-[#1e3932]">Gemini’s answer</h3><p className="mt-2 text-sm leading-6 text-[#36584e]">{analysis.answer}</p></div>
              {analysis.observations.length ? <ul className="mt-5 list-disc space-y-1.5 pl-5 text-xs leading-5 text-[#68706a]">{analysis.observations.map((observation) => <li key={observation}>{observation}</li>)}</ul> : null}
              <p className="mt-5 border-t pt-4 text-[11px] leading-5 text-[#777]">{analysis.disclaimer}</p>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardPageShell>
  );
}
