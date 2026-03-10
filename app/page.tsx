'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Layout, Zap, ArrowRight, BarChart3, Globe, Download, CheckCircle2, XCircle, Lightbulb, Mail, MessageSquare, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    let cleanUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      cleanUrl = 'https://' + url;
    }

    setIsAnalyzing(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze website');

      setResults({ ...data, url: cleanUrl });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('AI_Website_Analysis.pdf');
    } catch (e) {
      console.error("PDF generation failed", e);
      alert("Failed to generate PDF. Check console for details.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-white overflow-hidden">
      {/* minimal hero */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-4">
            AI Portfolio Analyzer
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Get AI-powered insights to improve your portfolio design, structure, and impact.
          </p>

          <form onSubmit={handleAnalyze} className="max-w-xl mx-auto relative group">
            <div className="flex flex-col sm:flex-row shadow-sm border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-600 transition-shadow">
              <div className="flex-1 flex items-center bg-white px-4 py-3 sm:py-0">
                <Globe className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                <input
                  type="url"
                  required
                  placeholder="https://your-portfolio.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-slate-900 text-lg placeholder-slate-400 focus:bg-slate-50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isAnalyzing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 sm:py-3 text-lg font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI reviewing portfolio...</span>
                  </>
                ) : (
                  <>
                    Analyze Portfolio <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-red-500 mt-4 text-sm font-medium text-left px-2">{error}</p>}
            <p className="mt-4 text-xs text-slate-400 font-medium">AI analysis powered by Google Gemini</p>
          </form>
        </motion.div>
      </section>

      {/* Results Section */}
      {results && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full" id="results">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
              <p className="text-slate-500">{results.url}</p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            ref={reportRef}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12"
          >

            {/* Minimal Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex-1 w-full flex items-center justify-center">
                <div className="w-full max-w-sm aspect-[21/9] bg-white rounded-lg overflow-hidden border border-slate-200 relative shadow-sm">
                  <WebsitePreview url={results.url} />
                </div>
              </div>
              <div className="bg-white px-8 py-6 rounded-xl border border-slate-100 shadow-sm text-center min-w-[200px]">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Score</div>
                <div className="text-5xl font-extrabold text-slate-900">
                  {results.overall_score || 0}
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Score Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <MiniScoreCard title="Portfolio Design" icon={<Layout className="w-5 h-5" />} score={results.design_score} />
                <MiniScoreCard title="Content Quality" icon={<Search className="w-5 h-5" />} score={results.content_score} />
                <MiniScoreCard title="UX & Navigation" icon={<Zap className="w-5 h-5" />} score={results.ux_score} />
              </div>

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Key Strengths</h3>
                  <div className="grid gap-3">
                    {results.strengths?.map((item: string, i: number) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-slate-700 text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> Areas for Improvement</h3>
                  <div className="grid gap-3">
                    {results.improvements?.map((item: string, i: number) => (
                      <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-start gap-3">
                        <Zap className="w-5 h-5 text-amber-500 shrink-0" />
                        <span className="text-slate-700 text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Missing Sections & Final Feedback */}
              <div className="grid md:grid-cols-2 gap-8 border-t border-slate-100 pt-10">
                {results.missing_sections && results.missing_sections.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-rose-500" /> Missing Sections
                    </h3>
                    <ul className="grid gap-2 text-sm text-slate-700 bg-rose-50/50 p-6 rounded-xl border border-rose-100">
                      {results.missing_sections.map((sec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-400 mt-0.5">•</span>
                          <span className="font-medium">{sec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={!(results.missing_sections && results.missing_sections.length > 0) ? "md:col-span-2" : ""}>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" /> Final Feedback
                  </h3>
                  <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 h-full">
                    <p className="text-indigo-900 text-sm leading-relaxed">{results.final_feedback}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Consultation CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-10 text-center max-w-4xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Need Help Improving Your Portfolio?</h2>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
              If you’d like help improving your portfolio’s design, structure, or impact, I can help.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a
                href="mailto:contact@example.com"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 px-6 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                <Mail className="w-4 h-4" /> Email Me
              </a>
              <a
                href="#"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 px-6 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" /> Send a Message
              </a>
              <a
                href="https://calendly.com/abdulahaddayater1123/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-sm"
              >
                <Calendar className="w-4 h-4" /> Schedule a Call
              </a>
            </div>

            <p className="text-sm text-slate-400">
              Portfolio improvements by Abdulahad Dayatar
            </p>
          </motion.div>
        </section>
      )}

      {/* Features Outline */}
      {!results && (
        <motion.section
          id="features"
          className="py-24 bg-slate-50/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <SimpleFeature
                icon={<Layout className="w-6 h-6 text-slate-700" />}
                title="Portfolio Design Review"
                delay={0.1}
              />
              <SimpleFeature
                icon={<Search className="w-6 h-6 text-slate-700" />}
                title="Content Feedback"
                delay={0.2}
              />
              <SimpleFeature
                icon={<Zap className="w-6 h-6 text-slate-700" />}
                title="UX & Navigation"
                delay={0.3}
              />
              <SimpleFeature
                icon={<BarChart3 className="w-6 h-6 text-slate-700" />}
                title="Professional Impact"
                delay={0.4}
              />
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}

// Subcomponents

function MiniScoreCard({ title, icon, score = 0 }: { title: string, icon: React.ReactNode, score: number }) {
  const isGood = score >= 80;
  const isOk = score >= 60 && score < 80;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
          {icon}
        </div>
        <div className="font-semibold text-slate-700">{title}</div>
      </div>
      <div className={`text-2xl font-bold ${isGood ? 'text-green-600' : isOk ? 'text-amber-500' : 'text-red-500'}`}>
        {score}
      </div>
    </div>
  );
}

function SeoItem({ label, status }: { label: string, status?: string }) {
  if (!status) return null;
  const isGood = status.toLowerCase().includes("good");
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="text-sm font-semibold text-slate-700">{label}</div>
      <div>
        {isGood ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pass
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
            <XCircle className="w-3.5 h-3.5" /> Review
          </div>
        )}
      </div>
    </div>
  );
}

function StructureItem({ label, status }: { label: string, status?: string }) {
  if (!status) return null;
  const isPresent = status.toLowerCase() === 'present';

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
      <div className="text-sm font-semibold text-slate-700">{label}</div>
      <div>
        {isPresent ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" /> Present
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">
            <XCircle className="w-3.5 h-3.5" /> Missing
          </div>
        )}
      </div>
    </div>
  );
}

function SimpleFeature({ icon, title, delay = 0 }: { icon: React.ReactNode, title: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="p-6 bg-white rounded-xl border border-slate-200 text-center hover:shadow-sm transition-shadow"
    >
      <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900">{title}</h3>
    </motion.div>
  );
}

function WebsitePreview({ url }: { url: string }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6 text-center">
        <Layout className="w-8 h-8 mb-2 opacity-30" />
        <span className="text-sm font-medium">Preview not available for this website.</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
          <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`}
        alt="Portfolio Preview"
        className={`w-full h-full object-cover object-top transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  );
}
