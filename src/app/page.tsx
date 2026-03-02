'use client'

import { useState, useEffect } from 'react'
import Uploader from '@/components/Uploader'
import { processMedicalDocuments, findMatchingTest } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Stethoscope, 
  Activity, 
  User, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Clock,
  Layers,
  FlaskConical,
  ClipboardList,
  Fingerprint,
  Microscope,
  Dna,
  History,
  ShieldCheck,
  TrendingUp,
  RefreshCcw,
  ArrowRight,
  Eye,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Sparkles,
  Info,
  ChevronDown
} from 'lucide-react'

interface DocumentResult {
  fileName: string
  documentType?: string
  patientName?: string
  clinicalFindings?: string | string[]
  diagnosis?: string
  biomarkers?: string | string[]
  treatmentDetails?: string
  confidenceScore?: number
  originalFile?: { name: string, type: string, data: string, storageId?: string }
  error?: string
}

interface MatchingTest {
  matching_test?: string
  clinical_rationale?: string
  relevance_score?: number
  error?: string
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<DocumentResult[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // States for matching test (Global)
  const [isMatching, setIsMatching] = useState(false)
  const [globalMatch, setGlobalMatch] = useState<MatchingTest | null>(null)

  const clearStorage = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('doc_')) localStorage.removeItem(key)
    })
  }

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles])
    setError(null)
  }

  const handleProcess = async () => {
    if (files.length === 0) return
    
    setIsProcessing(true)
    setError(null)
    setResults([])
    setGlobalMatch(null)
    clearStorage()

    try {
      const fileData = await Promise.all(
        files.map(async (file, index) => {
          return new Promise<{ name: string, type: string, data: string, storageId: string }>((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
              const dataUrl = reader.result as string
              const storageId = `doc_${index}_${Date.now()}`
              try {
                localStorage.setItem(storageId, dataUrl)
              } catch (e) {
                console.warn('File too large for localStorage, falling back to temporary URL')
              }
              resolve({
                name: file.name,
                type: file.type,
                data: dataUrl,
                storageId
              })
            }
            reader.onerror = error => reject(error)
          })
        })
      )

      const response = await processMedicalDocuments(fileData)
      
      if ('globalError' in response) {
        setError(response.globalError as string)
      } else {
        const enrichedResults = (response as DocumentResult[]).map((res, i) => ({
          ...res,
          originalFile: {
            ...res.originalFile!,
            storageId: fileData[i].storageId
          }
        }))
        setResults(enrichedResults)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while processing')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFindGlobalTest = async () => {
    if (results.length === 0) return
    
    setIsMatching(true)
    setGlobalMatch(null)

    // Combine all extracted data for global context
    const combinedContext = results.map(res => ({
      diagnosis: res.diagnosis,
      biomarkers: res.biomarkers,
      findings: res.clinicalFindings,
      docType: res.documentType
    }))

    try {
      const match = await findMatchingTest(combinedContext)
      setGlobalMatch(match)
    } catch (err) {
      console.error("Match error:", err)
    } finally {
      setIsMatching(false)
    }
  }

  const handleReset = () => {
    setFiles([])
    setResults([])
    setError(null)
    setGlobalMatch(null)
    clearStorage()
  }

  const handleViewDocument = (storageId?: string, fallbackData?: string) => {
    const data = storageId ? localStorage.getItem(storageId) || fallbackData : fallbackData
    if (!data) return

    const win = window.open()
    if (win) {
      win.document.write(`
        <html>
          <head><title>Document Preview</title></head>
          <body style="margin:0; background:#f0f2f5; display:flex; justify-content:center; align-items:center;">
            ${data.includes('pdf') 
              ? `<embed src="${data}" width="100%" height="100%" type="application/pdf" />`
              : `<img src="${data}" style="max-width:100%; max-height:100%; object-fit:contain; box-shadow:0 10px 50px rgba(0,0,0,0.1); border-radius:12px;"/>`
            }
          </body>
        </html>
      `)
      win.document.close()
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafc] text-[#1a1a1b] font-sans medical-grid pb-24 selection:bg-cyan-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.03),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24">
        {/* Header with LOGO.SVG */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-b border-slate-200 pb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white p-3 border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
                <img src="/logo.svg" alt="OncoStream Logo" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
                    <Stethoscope className="w-4 h-4 text-cyan-600" />
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-cyan-600/60">Molecular Synthesis Portal</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-none">
                  Onco<span className="text-cyan-600">Stream</span>
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {results.length > 0 && (
              <button 
                onClick={handleReset}
                className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:bg-black transition-all flex items-center gap-3 active:scale-95"
              >
                <RefreshCcw className="w-4 h-4" /> Start New Batch
              </button>
            )}
            <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-[10px] font-bold tracking-widest uppercase text-slate-500 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
              Clinical Engine Active
            </div>
          </div>
        </header>

        {!results.length ? (
          <div className="max-w-4xl mx-auto space-y-12">
            <section className="bg-white border border-slate-100 rounded-[3rem] p-12 md:p-16 shadow-[0_32px_100px_rgba(0,0,0,0.04)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] -z-10" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
                    <Layers className="w-6 h-6 text-cyan-600" />
                    Medical Record Ingestion
                  </h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Molecular Extraction Support Level: 100%</p>
                </div>
              </div>
              
              <Uploader onFilesSelected={handleFilesSelected} isLoading={isProcessing} />

              <div className="mt-14 flex justify-center">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || files.length === 0}
                  className={`relative group px-16 py-5 rounded-[1.25rem] font-bold transition-all flex items-center gap-4 active:scale-95 shadow-xl transition-all duration-300
                    ${isProcessing || files.length === 0 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-black hover:shadow-cyan-100 shadow-[0_20px_40px_rgba(0,0,0,0.1)]'}`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Performing Deep Analysis...
                    </>
                  ) : (
                    <>
                      Execute Extraction Core
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-24">
            
            {/* GLOBAL RECOMENTER BUTTON (New) */}
            <div className="flex flex-col items-center gap-8 mb-20 bg-white border border-slate-200 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500" />
               <div className="text-center space-y-3">
                  <div className="flex justify-center mb-4">
                     <div className="p-4 bg-cyan-50 rounded-2xl animate-bounce">
                        <Sparkles className="w-8 h-8 text-cyan-600" />
                     </div>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Patient Synthesis Recommended Panel</h2>
                  <p className="text-slate-500 max-w-xl font-medium">Use the collective context from all extracted clinical documents to determine the optimal diagnostic pathway.</p>
               </div>

               {!globalMatch ? (
                  <button 
                    onClick={handleFindGlobalTest}
                    disabled={isMatching}
                    className="px-14 py-6 bg-cyan-600 text-white rounded-[2rem] font-black text-lg flex items-center gap-4 hover:bg-cyan-700 hover:shadow-2xl hover:shadow-cyan-500/30 transition-all active:scale-95 group shadow-xl"
                  >
                     {isMatching ? (
                        <>
                           <Loader2 className="w-6 h-6 animate-spin" />
                           Synthesizing All Data...
                        </>
                     ) : (
                        <>
                           Determine Global Match
                           <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                        </>
                     )}
                  </button>
               ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl w-full bg-slate-50 border-2 border-cyan-100 rounded-[3rem] p-10 md:p-14 relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 p-12 opacity-[0.05] grayscale group-hover:grayscale-0 transition-all duration-700">
                        <ShieldCheck className="w-48 h-48 text-cyan-600" />
                     </div>
                     
                     <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10 pb-8 border-b border-slate-200/60">
                        <div className="space-y-3">
                           <div className="px-4 py-1.5 bg-cyan-100 text-cyan-700 text-[10px] font-black uppercase tracking-[0.3em] rounded-full inline-flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3"/> Optimal Synthesis Selection
                           </div>
                           <h3 className="text-4xl font-black text-slate-900 tracking-tight">{globalMatch.matching_test?.replace('.pdf', '')}</h3>
                        </div>
                        <div className="flex items-center gap-6 bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
                           <div className="space-y-1">
                              <p className="text-[9px] uppercase font-bold text-slate-400">Match Accuracy</p>
                              <p className="text-2xl font-black text-slate-900">{((globalMatch.relevance_score || 0) * 100).toFixed(0)}%</p>
                           </div>
                           <TrendingUp className="w-10 h-10 text-green-500" />
                        </div>
                     </div>

                     <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-3">
                              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Clinical Rationale</p>
                              <p className="text-md font-medium text-slate-700 leading-relaxed italic">
                                 "{globalMatch.clinical_rationale}"
                              </p>
                           </div>
                           <div className="space-y-5">
                              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Platform Access</p>
                              <a 
                                href={`/tests/${globalMatch.matching_test}`} 
                                target="_blank"
                                className="group/link flex items-center justify-between p-6 bg-white border border-slate-200 rounded-[2rem] hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300"
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                                       <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-slate-900">{globalMatch.matching_test}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">View PDF Brochure</p>
                                    </div>
                                 </div>
                                 <ExternalLink className="w-5 h-5 text-slate-300 group-hover/link:text-cyan-500 group-hover/link:translate-x-1 transition-all" />
                              </a>
                           </div>
                        </div>

                        <div className="flex justify-center pt-4">
                           <button onClick={handleFindGlobalTest} className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-2 group/refresh">
                              <RefreshCcw className="w-4 h-4 group-hover/refresh:rotate-90 transition-transform" /> Re-analyze Synthesis
                           </button>
                        </div>
                     </div>
                  </motion.div>
               )}
            </div>

            <div className="space-y-16">
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                 <div className="h-px bg-slate-200 flex-grow" />
                 Extracted Evidence Blocks
                 <div className="h-px bg-slate-200 flex-grow" />
              </h3>
              
              <AnimatePresence>
                {results.map((res, idx) => (
                  <motion.section
                    key={idx}
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.8 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-slate-200 rounded-[3rem] bg-white overflow-hidden shadow-[0_40px_120px_rgba(15,23,42,0.06)]"
                  >
                    {/* Left Column: Source Document */}
                    <div className="lg:col-span-4 bg-slate-50/50 p-10 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-5 mb-8">
                           <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                              <FileText className="w-7 h-7 text-cyan-600" />
                           </div>
                           <div>
                              <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-cyan-600/60 mb-1">RECORD 0{idx + 1}</p>
                              <h3 className="text-xl font-bold text-slate-900 truncate max-w-[200px] tracking-tight">{res.fileName}</h3>
                           </div>
                        </div>

                        {res.originalFile?.type.startsWith('image/') ? (
                           <div className="relative group rounded-[2rem] overflow-hidden border border-slate-200 aspect-[4/3] bg-white shadow-inner">
                              <img src={res.originalFile.data} className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-700 p-4" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/5 backdrop-blur-[2px]">
                                 <button onClick={() => handleViewDocument(res.originalFile?.storageId, res.originalFile?.data)} className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl flex items-center gap-3 shadow-2xl active:scale-95 transition-transform"><Eye className="w-4 h-4" /> View Source</button>
                              </div>
                           </div>
                        ) : (
                           <div className="rounded-[2rem] border-2 border-dashed border-slate-200 aspect-[4/3] flex flex-col items-center justify-center text-slate-400 bg-white/50 group hover:border-cyan-200 transition-colors">
                              <FileSearch className="w-12 h-12 mb-4 opacity-30 text-cyan-600" />
                              <p className="text-[10px] uppercase font-bold tracking-widest mb-4">Diagnostic Entry</p>
                              <button onClick={() => handleViewDocument(res.originalFile?.storageId, res.originalFile?.data)} className="px-5 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-white hover:text-cyan-600 transition-all shadow-sm">Open PDF Source</button>
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Structured Data */}
                    <div className="lg:col-span-8 p-10 md:p-14 space-y-10 bg-white">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-3">
                             <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Diagnosis Core</p>
                             <p className="text-xl font-black text-slate-900 leading-tight">{res.diagnosis || 'Clinical Findings Baseline'}</p>
                          </div>
                          <div className="space-y-3">
                             <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Molecular Bio-Markers</p>
                             <div className="flex flex-wrap gap-2">
                                {Array.isArray(res.biomarkers) && res.biomarkers.length > 0 ? res.biomarkers.map((b, i) => (
                                   <span key={i} className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-[10px] text-[10px] font-black text-slate-700 uppercase tracking-tight">
                                      {b}
                                   </span>
                                )) : <span className="text-xs font-semibold text-slate-400">None extracted.</span>}
                             </div>
                          </div>
                       </div>

                       <div className="pt-8 border-t border-slate-100 space-y-4">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-2">
                             <ClipboardList className="w-4 h-4 text-cyan-600" /> Clinical Extract Summary
                          </p>
                          <div className="grid grid-cols-1 gap-3">
                             {Array.isArray(res.clinicalFindings) ? res.clinicalFindings.map((finding, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                   <span className="text-cyan-600 font-bold text-xs pt-0.5">0{i+1}</span>
                                   <span className="font-medium text-[13px]">{finding}</span>
                                </div>
                             )) : <div className="text-sm italic text-slate-400">No granular findings found.</div>}
                          </div>
                       </div>
                    </div>
                  </motion.section>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
