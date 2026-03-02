'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface DocumentResult {
  fileName: string
  documentType?: string
  patientName?: string
  patientAge?: string
  patientGender?: string
  referredBy?: string
  reportDate?: string
  clinicalFindings?: string | string[]
  diagnosis?: string
  biomarkers?: string | string[]
  treatmentDetails?: string
  timelineEvents?: { date: string, event: string, type?: string }[]
  confidenceScore?: number
  originalFile?: { name: string, type: string, data: string, storageId?: string }
  error?: string
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function processMedicalDocuments(files: { name: string, type: string, data: string }[]): Promise<DocumentResult[] | { globalError: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const results = await Promise.all(
      files.map(async (file) => {
        const prompt = `
          You are a world-class specialized oncology diagnostic extraction engine using high-precision OCR. 
          Analyze this clinical document (Physician Note / Lab Report / Imaging Result).
          
          PERFORM DEEP OCR AND EXTRACT THE FOLLOWING FIELDS PRECISELY:
          - fileName: "${file.name}"
          - documentType: Specific clinical category
          - patientName: Full name (e.g., 'Mrs. MANDA KANDURWAR')
          - patientAge: Extracted age (e.g., '66 Y(s)')
          - patientGender: Extracted gender (e.g., 'Female')
          - referredBy: Clinical specialist/doctor name
          - reportDate: Date of the report generation
          - clinicalFindings: Detailed bulleted list of all medical/pathological observations
          - diagnosis: Definitive diagnosis or impression
          - biomarkers: Direct extraction of all genomic findings (e.g., ER/PR, HER2, EGFR)
          - treatmentDetails: Surgical procedures, drugs, or therapeutic plans mentioned
          - timelineEvents: A list of chronologically relevant events found IN THE CONTENT of the document. Each event MUST have:
            - date: The date of the event as mentioned in the text (e.g., '2024-01-15', 'October 2023').
            - event: A short description of what happened (e.g., 'Left mastectomy', 'Treatment initiated', 'Biopsy performed').
            - type: One of ['diagnosis', 'treatment', 'test', 'observation'].
          - confidenceScore: Scale 0.0 to 1.0
          
          CRITICAL: Provide dates as mentioned in the clinical history or report findings. 
          Do not use today's date unless it specifically refers to the report generation date being an event.
          ONLY return valid JSON. Do not include markdown code blocks or preamble.
        `

        const part = {
          inlineData: {
            data: file.data.split(',')[1],
            mimeType: file.type
          }
        }

        const result = await model.generateContent([prompt, part])
        const response = await result.response
        const text = response.text()

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return { ...parsed, originalFile: { name: file.name, type: file.type, data: file.data } }
        }
        
        return { fileName: file.name, error: 'Failed to extract', raw: text }
      })
    )

    return results
  } catch (error: any) {
    console.error('Gemini Processing Error:', error)
    return { globalError: error.message || 'Unknown processing error' }
  }
}

const TEST_SUMMARIES = {
  "OncoHRD new brochure.pdf": "OncoHRD is a cutting-edge HRD (Homologous Recombination Deficiency) assay specifically for solid tumors like Breast, Ovarian, Pancreatic, and Prostate cancers. It detects BRCA1/2 mutations and 50+ HRR genes to guide the use of PARP inhibitors and platinum-based chemotherapy by scoring genomic 'scars' like LOH, TAI, and LST.",
  "OncoIndx new brochure.pdf": "OncoIndx is a comprehensive Next-Gen Sequencing (NGS) genomic profiling panel for all solid tumors, covering 1000+ genes. It identifies actionable insights including SNVs, INDELs, CNA, Fusions, TMB, and MSI to personalize treatment for complex, advanced, or refractory cancer patients.",
  "OncoMonitor new brochure.pdf": "OncoMonitor is a liquid biopsy test for longitudinal cancer monitoring and Minimal Residual Disease (MRD) detection via ctDNA and CTCs. It tracks disease progression, treatment response, and emergence of resistance across various solid tumors like Colon, Breast, and Prostate cancers.",
  "OncoRisk new brochure.pdf": "OncoRisk is a comprehensive germline genetic test examining a 74-gene panel to uncover hereditary and familial cancer risk. It helps identify at-high-risk unaffected relatives and guides proactive screening or surgical choices (like prophylactic mastectomy) for 11+ distinct cancer types.",
  "OncoTarget new brochure.pdf": "OncoTarget is a specialized targeted NGS panel designed for clinically actionable mutations in cancers such as Lung, Breast, Colon, and Prostate. It covers key genes like EGFR, ALK, KRAS, and BRAF to accelerate targeted therapy decisions and assess treatment resistance pathways.",
  "OncoIndx prime+ new brochure.pdf": "OncoIndx Prime+ is an elite version of the OncoIndx genomic profiling series, offering the most comprehensive solid tumor profiling with expanded clinical utility.",
  "OncoIndx tbx new brochure.pdf": "OncoIndx TBx is the tissue-based specialized version of the OncoIndx panel, optimized for high-fidelity genomic analysis from FFPE tissue blocks to guide therapy selection."
}

export async function findMatchingTest(patientData: any) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `
      As an expert clinical recommendation engine, analyze the following extracted patient data and find the most suitable oncology test from the available laboratory options.
      
      Patient Data:
      ${JSON.stringify(patientData, null, 2)}
      
      Available Tests:
      ${JSON.stringify(TEST_SUMMARIES, null, 2)}
      
      Your Goal:
      - Pick exactly one "matching_test" filename from the Available Tests list.
      - Provide a "clinical_rationale" (2-3 sentences) explaining why this test is the best choice for this specific patient based on their biomarkers, diagnosis, or clinical history.
      - Provide a "relevance_score" (0.0 to 1.0).
      
      Return as a valid JSON object.
    `
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return { error: 'Matching failed' }
  } catch (error: any) {
    console.error('Matching Error:', error)
    return { error: error.message }
  }
}
