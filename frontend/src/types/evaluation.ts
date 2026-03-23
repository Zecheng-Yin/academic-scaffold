export interface EvaluationItemResult {
  item_id: string
  semantic_score: number
  formality_score: number
  overall_score: number
  user_input: string
  reference_answer: string
  feedback_text: string
  suggested_phrases: string[]
}

export interface EvaluationResponse {
  session_id: string
  step: number
  overall_score: number
  items: EvaluationItemResult[]
  global_feedback: string
}

export interface Step3EvaluationResponse {
  session_id: string
  step: 3
  overall_score: number
  semantic_score: number
  formality_score: number
  coverage_percentage: number
  covered_points: string[]
  missing_points: string[]
  formality_issues: Array<{
    original: string
    suggested_text: string
    reason: string
  }>
  global_feedback: string
  annotated_text: string
}
