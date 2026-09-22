'use client';

import { Button } from '@mantine/core';

import React, { useState } from 'react';
import { Terminal, Copy, Check, Code2 } from 'lucide-react';

export const DocsSection: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'python' | 'node' | 'curl'>('python');
  const [copied, setCopied] = useState(false);

  const snippets = {
    python: `# Cài đặt thư viện: pip install google-generativeai
import google.generativeai as genai

# Khóa API nhận từ LNHUB Store
genai.configure(api_key="AIzaSy_YOUR_API_KEY")

model = genai.GenerativeModel("gemini-1.5-pro")
response = model.generate_content("Viết đoạn thơ ngắn về công nghệ AI")

print(response.text)`,

    node: `// Cài đặt SDK: npm install @google/generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSy_YOUR_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function run() {
  const prompt = "Giải thích cơ chế hoạt động của Transformers trong 3 câu";
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

run();`,

    curl: `# Gọi trực tiếp REST API qua curl:
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=AIzaSy_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [
      {
        "parts": [{"text": "Xin chào Gemini Pro!"}]
      }
    ]
  }'`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="docs" className="relative z-10 mx-auto w-[min(1200px,calc(100%-32px))] pb-20">
      <div className="liquid-card p-6 sm:p-8 rounded-3xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="liquid-chip px-3 py-1 text-xs font-bold text-cyan-300 mb-2 inline-flex items-center gap-1.5">
              <Code2 className="size-3.5" />
              Dành cho Lập trình viên
            </div>
            <h3 className="text-2xl font-black text-white">
              Tích hợp Gemini API trong 30 giây
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sử dụng trực tiếp với Google Generative AI SDK chính thức hoặc REST API.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10">
            {(['python', 'node', 'curl'] as const).map((lang) => (
              <Button variant="default"
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  activeLang === lang
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </Button>
            ))}
            <Button variant="default"
              onClick={handleCopy}
              className="liquid-button-secondary p-2 ml-1 text-slate-300 hover:text-white"
              title="Sao chép mã mẫu"
            >
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#030712] border border-white/10 p-4 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed">
          <pre>{snippets[activeLang]}</pre>
        </div>
      </div>
    </section>
  );
};
