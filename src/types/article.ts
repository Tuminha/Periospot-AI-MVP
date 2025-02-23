export interface Author {
  firstName?: string;
  lastName?: string;
  affiliation?: string;
}

export interface ArticleMetadata {
  doi?: string;
  pmid?: string;
  title?: string;
  authors?: Author[];
  journal?: string;
  publicationYear?: number;
  abstract?: string;
  keywords?: string[];
  citations?: number;
  impactFactor?: number;
} 