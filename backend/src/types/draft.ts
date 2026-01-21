export interface ArticleDraft {
  id: string;
  userId: string;
  title: string;
  digest: string;
  content: string;
  topic?: string;
  createdAt: number;
  updatedAt: number;
}
