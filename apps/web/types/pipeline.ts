export interface Pipeline {
  id: string;
  profile_id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  color: string;
  order_index: number;
}

export interface PipelineCard {
  id: string;
  contact_id: string;
  stage_id: string;
  pipeline_id: string;
  position: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface PipelineWithStages extends Pipeline {
  stages: PipelineStage[];
  cards: PipelineCard[];
}
