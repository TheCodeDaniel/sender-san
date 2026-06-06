import { useState } from "react";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

export default function Step4Keys({ onNext, onBack, initialKeys = {} }) {
  const [keys, setKeys] = useState({
    groq_key: initialKeys.groq_key ?? "",
    contactout_key: initialKeys.contactout_key ?? "",
    google_client_id: initialKeys.google_client_id ?? "",
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field, val) => setKeys((k) => ({ ...k, [field]: val }));

  const validate = () => {
    const e = {};
    if (!keys.groq_key) e.groq_key = "Required";
    if (!keys.contactout_key) e.contactout_key = "Required";
    if (!keys.google_client_id) e.google_client_id = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => {
    if (validate()) onNext({ keys });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-1">
          API keys
        </h2>
        <p className="text-text-muted text-sm">
          Your keys are stored locally in your browser. Never sent to any
          server.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Groq API Key"
          showToggle
          value={keys.groq_key}
          onChange={(e) => set("groq_key", e.target.value)}
          error={errors.groq_key}
          placeholder="gsk_..."
        />
        <p className="text-xs text-text-muted -mt-2">
          Get yours free at{" "}
          <a
            href="https://console.groq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline"
          >
            console.groq.com
          </a>{" "}
          — no credit card needed.
        </p>

        <Input
          label="ContactOut API Key"
          showToggle
          value={keys.contactout_key}
          onChange={(e) => set("contactout_key", e.target.value)}
          error={errors.contactout_key}
          placeholder="co_..."
        />
        <p className="text-xs text-text-muted -mt-2">
          Get yours at{" "}
          <a
            href="https://contactout.com/api-feature"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline"
          >
            contactout.com/api-feature
          </a>
        </p>

        <Input
          label="Google Cloud OAuth 2.0 Client ID"
          showToggle
          value={keys.google_client_id}
          onChange={(e) => set("google_client_id", e.target.value)}
          error={errors.google_client_id}
          placeholder="123456789-abc.apps.googleusercontent.com"
        />

        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="text-xs text-secondary hover:underline transition-smooth"
        >
          {guideOpen ? "▲ Hide" : "▼ Show"} Google OAuth setup guide
        </button>

        {guideOpen && (
          <div className="card p-4 text-xs text-text-muted space-y-1.5 border-l-2 border-secondary">
            <ol className="list-decimal list-inside space-y-1.5">
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:underline"
                >
                  console.cloud.google.com
                </a>
              </li>
              <li>Create a new project (or select existing)</li>
              <li>
                Enable <strong className="text-text-primary">Gmail API</strong>{" "}
                under "APIs &amp; Services &gt; Library"
              </li>
              <li>Go to "APIs &amp; Services &gt; Credentials"</li>
              <li>
                Create{" "}
                <strong className="text-text-primary">
                  OAuth 2.0 Client ID
                </strong>{" "}
                → Web application
              </li>
              <li>
                Add your app URL to "Authorised JavaScript origins" (e.g.{" "}
                <code className="text-secondary">
                  https://yourusername.github.io
                </code>
                )
              </li>
              <li>Copy the Client ID and paste it above</li>
            </ol>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={handleNext}>Complete setup →</Button>
      </div>
    </div>
  );
}
