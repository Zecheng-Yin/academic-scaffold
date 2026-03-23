export interface ClozeItem {
  item_id: string
  // Step 1
  sentence_skeleton?: string
  correct_facts?: string[]
  blank_labels?: string[]
  source_sentence?: string
  // Step 2
  given_facts?: string
  sentence_with_blanks?: string
  chinese_prompt?: string
  correct_structure?: string[]
  phrasebank_source?: string
}

export interface Step1Response {
  session_id: string
  items: ClozeItem[]
}

export interface Step2Response {
  session_id: string
  items: ClozeItem[]
}

export interface Step3Response {
  session_id: string
  chinese_outline: string[]
}

export type ScaffoldStep = 1 | 2 | 3

export type StepStatus = 'idle' | 'loading' | 'active' | 'submitted' | 'complete'
