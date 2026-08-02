import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StepIndicator } from "@/components/report/StepIndicator";
import { PhotoStep } from "@/components/report/PhotoStep";
import { LocationPicker } from "@/components/map/LocationPicker";
import { SubmittingStep } from "@/components/report/SubmittingStep";
import { SuccessStep } from "@/components/report/SuccessStep";
import { api, extractErrorMessage } from "@/lib/api";
import { useMyReports } from "@/hooks/useMyReports";
import { useToast } from "@/context/ToastContext";
import type { ReportResponse } from "@/types/api";

// Default map center: Indirapuram, Ghaziabad — used until GPS resolves.
const DEFAULT_LAT = 28.6469;
const DEFAULT_LNG = 77.391;

type Step = 1 | 2 | 3 | 4 | 5;

async function rotateFile(file: File): Promise<File> {
  const img = document.createElement("img");
  const url = URL.createObjectURL(file);
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.height;
  canvas.height = img.width;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  URL.revokeObjectURL(url);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(file);
      resolve(new File([blob], file.name, { type: file.type }));
    }, file.type);
  });
}

export default function ReportWizard() {
  const navigate = useNavigate();
  const { addReportId } = useMyReports();
  const { push } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [locating, setLocating] = useState(false);
  const [gpsSource, setGpsSource] = useState<"default" | "device" | "manual">("default");

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [reqDone, setReqDone] = useState(false);

  const previewUrlRef = useRef<string | null>(null);
  previewUrlRef.current = previewUrl;

  const handleFileSelected = useCallback((f: File, url: string) => {
    setPhotoError(null);
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const handleClearPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleRotate = async () => {
    if (!file) return;
    const rotated = await rotateFile(file);
    const url = URL.createObjectURL(rotated);
    setFile(rotated);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      push({ variant: "info", title: "Location unavailable", description: "Your browser doesn't support GPS — drag the pin instead." });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGpsSource("device");
        setLocating(false);
      },
      () => {
        setLocating(false);
        push({ variant: "info", title: "Couldn't get GPS location", description: "Drag the pin to set it manually." });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async () => {
    if (!file) return;
    setStep(4);
    setSubmitting(true);
    setSubmitError(null);
    setReqDone(false);
    try {
      const report = await api.submitReport(file, lat, lng);
      setReqDone(true);
      setTimeout(() => {
        setResult(report);
        addReportId(report.id);
        if (report.upvotes > 1) {
          push({
            variant: "success",
            title: "Merged with a nearby report",
            description: "Priority boosted — thanks for confirming it.",
          });
        } else {
          push({ variant: "success", title: "Report submitted", description: `Issue #${report.id} is now in the queue.` });
        }
        setStep(5);
        setSubmitting(false);
      }, 500);
    } catch (e) {
      setSubmitting(false);
      setSubmitError(extractErrorMessage(e));
      setStep(3);
    }
  };

  const canGoStep2 = !!file;
  const canGoStep3 = true;

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {step < 4 && (
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => (step === 1 ? navigate(-1) : setStep((s) => (s - 1) as Step))}
              className="text-ink-500 hover:text-ink-800 flex items-center gap-1.5 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <StepIndicator current={step} />
            <div className="w-12" />
          </div>
        )}

        <Card className="p-5 sm:p-7">
          {step === 1 && (
            <>
              <h1 className="font-display text-xl font-bold text-ink-900 mb-1">Upload a photo</h1>
              <p className="text-ink-500 text-sm mb-6">Show us the pothole, leak, or hazard exactly as it looks.</p>
              <PhotoStep
                file={file}
                previewUrl={previewUrl}
                onFileSelected={handleFileSelected}
                onClear={handleClearPhoto}
                onRotate={handleRotate}
                error={photoError}
              />
              <Button fullWidth size="lg" className="mt-7" disabled={!canGoStep2} onClick={() => setStep(2)}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-xl font-bold text-ink-900 mb-1">Confirm location</h1>
              <p className="text-ink-500 text-sm mb-5">
                {gpsSource === "device" ? "Using your device's GPS location." : "Drag the pin to the exact spot, or use GPS."}
              </p>
              <div className="h-80 sm:h-96">
                <LocationPicker
                  lat={lat}
                  lng={lng}
                  onChange={(la, ln) => {
                    setLat(la);
                    setLng(ln);
                    setGpsSource("manual");
                  }}
                  onLocateMe={locateMe}
                  locating={locating}
                />
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-ink-500">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </div>
              <Button fullWidth size="lg" className="mt-6" disabled={!canGoStep3} onClick={() => setStep(3)}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-display text-xl font-bold text-ink-900 mb-1">Review & submit</h1>
              <p className="text-ink-500 text-sm mb-5">Double-check everything before sending it off.</p>

              {previewUrl && (
                <img src={previewUrl} alt="Report preview" className="w-full h-56 object-cover rounded-xl border border-ink-200 mb-4" />
              )}

              <div className="flex items-center gap-2.5 bg-ink-50 rounded-xl p-3.5 mb-4">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="text-sm text-ink-700 font-medium">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              </div>

              <label className="block mb-5">
                <span className="text-sm font-semibold text-ink-700">Notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything else worth mentioning…"
                  className="mt-1.5 w-full rounded-xl border border-ink-200 p-3 text-sm text-ink-800 focus:border-brand-500 outline-none resize-none"
                />
                <span className="text-[11px] text-ink-400 mt-1 block">
                  Kept with your device only — doesn't affect the AI analysis.
                </span>
              </label>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-ok-700 font-medium">
                  <span className="w-4.5 h-4.5 rounded-full bg-ok-100 flex items-center justify-center text-ok-600 text-xs">✓</span>
                  Image selected
                </div>
                <div className="flex items-center gap-2 text-sm text-ok-700 font-medium">
                  <span className="w-4.5 h-4.5 rounded-full bg-ok-100 flex items-center justify-center text-ok-600 text-xs">✓</span>
                  Location confirmed
                </div>
              </div>

              {submitError && (
                <div className="flex items-start gap-2.5 bg-danger-50 border border-danger-100 rounded-xl p-3.5 mb-4">
                  <AlertTriangle className="w-4 h-4 text-danger-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-danger-700 leading-relaxed">{submitError}</p>
                </div>
              )}

              <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting}>
                Ready to submit
                <ArrowRight className="w-4 h-4" />
              </Button>
              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-ink-400 hover:text-ink-700 mt-3 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                Start over
              </button>
            </>
          )}

          {step === 4 && <SubmittingStep done={reqDone} />}

          {step === 5 && result && <SuccessStep report={result} />}
        </Card>
      </div>
    </div>
  );
}
