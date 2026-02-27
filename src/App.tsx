/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Sparkles, Download, RefreshCw, User, Briefcase, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Lazy initialization function to prevent crash if API key is missing during module load
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API Key is missing. Please set GEMINI_API_KEY in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setProcessedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
    });
  };

  const generateAvatar = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      const ai = getAiClient();
      const resizedImage = await resizeImage(image);
      const base64Data = resizedImage.split(',')[1];
      const mimeType = 'image/jpeg';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "Professional corporate headshot. Replace background with a clean, blurred modern office studio. High-end lighting, sharp focus. If wearing sunglasses, replace with clear professional glasses or remove them. Final result: high-quality profile picture for LinkedIn/Upwork.",
            },
          ],
        },
      });

      let foundImage = false;
      const candidates = response.candidates || [];
      if (candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            setProcessedImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("The AI couldn't generate the image. Please try a different photo or try again.");
      }
    } catch (err: any) {
      console.error("Error generating avatar:", err);
      setError(err.message || "Server is busy or image is too complex. Please try again in a few seconds.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'professional-avatar.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <User size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">ProAvatar AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-black/60">
            <a href="#" className="hover:text-black transition-colors">How it works</a>
            <a href="#" className="hover:text-black transition-colors">Pricing</a>
            <button className="bg-black text-white px-4 py-2 rounded-full hover:bg-black/80 transition-all">
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column: Controls & Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl font-bold leading-[1.1] tracking-tight"
              >
                Your first impression, <span className="text-emerald-600">perfected.</span>
              </motion.h1>
              <p className="text-lg text-black/60 max-w-md">
                Turn any casual photo into a high-end professional headshot for Upwork, LinkedIn, and freelance platforms in seconds.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                
                {!image ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative w-full aspect-video rounded-2xl border-2 border-dashed border-black/10 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Upload your photo</p>
                      <p className="text-sm text-black/40">PNG, JPG up to 10MB</p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/10 group">
                      <img src={image} alt="Original" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                    <button
                      onClick={generateAvatar}
                      disabled={isProcessing}
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-200"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="animate-spin" size={20} />
                          Processing Magic...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Generate Professional Avatar
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-black/5 flex items-start gap-3">
                  <div className="text-emerald-600 mt-1"><CheckCircle2 size={18} /></div>
                  <div>
                    <p className="font-semibold text-sm">Background Removal</p>
                    <p className="text-xs text-black/40">Clean studio finish</p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-black/5 flex items-start gap-3">
                  <div className="text-emerald-600 mt-1"><CheckCircle2 size={18} /></div>
                  <div>
                    <p className="font-semibold text-sm">Pro Lighting</p>
                    <p className="text-xs text-black/40">Flattering studio light</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="relative">
            <div className="sticky top-28">
              <AnimatePresence mode="wait">
                {processedImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-6"
                  >
                    <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl shadow-black/10 border border-black/5">
                      <div className="aspect-square rounded-[2rem] overflow-hidden bg-slate-100 relative group">
                        <img 
                          src={processedImage} 
                          alt="Professional Avatar" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={downloadImage}
                            className="p-4 bg-white rounded-full text-black hover:scale-110 transition-transform shadow-xl"
                          >
                            <Download size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                        <Sparkles size={18} />
                        <span>Ready for your profile</span>
                      </div>
                      <button
                        onClick={downloadImage}
                        className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-black/80 transition-all shadow-xl"
                      >
                        <Download size={20} />
                        Download Headshot
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="aspect-square rounded-[2.5rem] border-2 border-dashed border-black/5 bg-white flex flex-col items-center justify-center text-black/20 gap-4"
                  >
                    <div className="w-24 h-24 rounded-full bg-black/[0.02] flex items-center justify-center">
                      <Briefcase size={48} />
                    </div>
                    <p className="font-medium">Your professional result will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Decorative elements */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/5 blur-[100px] rounded-full" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-black/5 py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white">
              <User size={14} />
            </div>
            <span className="font-bold text-sm">ProAvatar AI</span>
          </div>
          <p className="text-sm text-black/40">© 2026 ProAvatar AI. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium text-black/40">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
