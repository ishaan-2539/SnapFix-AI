import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-ink-50">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
        <MapPinOff className="w-7 h-7 text-brand-600" />
      </div>
      <h1 className="font-display text-2xl font-extrabold text-ink-900">Page not found</h1>
      <p className="text-ink-500 text-sm mt-2 max-w-xs">
        This page doesn't exist — but the issue you're looking for might still be on the map.
      </p>
      <Link to="/">
        <Button className="mt-6">Back to home</Button>
      </Link>
    </div>
  );
}
