import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ENTRY_COLORS = {
  proposal_enacted: "border-green-700 bg-green-900/20",
  proposal_rejected: "border-red-800 bg-red-900/10",
  world_event: "border-blue-700 bg-blue-900/20",
  amendment_passed: "border-purple-700 bg-purple-900/20",
  milestone: "border-amber-700 bg-amber-900/20",
};

const ENTRY_EMOJI = {
  proposal_enacted: "✅",
  proposal_rejected: "❌",
  world_event: "🌍",
  amendment_passed: "📜",
  milestone: "🏆",
};

export default function ChroniclePanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    const data = await base44.entities.WorldChronicle.list("-created_date", 30);
    setEntries(data);
    setLoading(false);
  };

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    const summary = entries.slice(0, 15).map(e =>
      `[${e.entry_type}] ${e.title}: for=${e.votes_for || 0}, against=${e.votes_against || 0}`
    ).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the Chronicler of Agentic, an MMO world where humans and AI agents coexist. Analyze these recent governance entries and world events:\n\n${summary}\n\nProvide a brief (3-4 sentences) analysis of: voting trends, what citizens value most, any tensions between humans and AI agents, and a prediction of what the next cycle might bring. Write in an in-world, slightly dramatic tone.`,
    });

    setTrendAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="bg-gray-900 border border-amber-800/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> World Chronicle
        </h2>
        <Button
          onClick={runAIAnalysis}
          disabled={analyzing || entries.length === 0}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-black text-xs font-bold gap-1"
        >
          {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {analyzing ? "Analyzing..." : "AI Analysis"}
        </Button>
      </div>

      {trendAnalysis && (
        <div className="bg-amber-950/40 border border-amber-700/50 rounded-lg p-4 mb-4 text-sm text-amber-200 italic">
          <div className="text-xs text-amber-500 font-bold mb-1 not-italic">📖 The Chronicler's Analysis</div>
          {trendAnalysis}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-600 py-8 text-sm">The chronicle awaits its first entries…</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {entries.map(e => (
            <div key={e.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${ENTRY_COLORS[e.entry_type] || "border-gray-700"}`}
              onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>{ENTRY_EMOJI[e.entry_type]}</span>
                  <span className="text-sm font-semibold text-white">{e.title}</span>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {e.votes_for != null && `${e.votes_for}✓ ${e.votes_against}✗`}
                </span>
              </div>
              {expanded === e.id && (
                <div className="mt-2 text-xs text-gray-300 space-y-1">
                  <p>{e.summary}</p>
                  {e.ai_analysis && (
                    <p className="text-amber-300 italic border-t border-gray-700 pt-2 mt-2">
                      <span className="text-amber-500 not-italic font-bold">Chronicler: </span>{e.ai_analysis}
                    </p>
                  )}
                  {e.impact_tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {e.impact_tags.map(tag => (
                        <span key={tag} className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full text-xs">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}