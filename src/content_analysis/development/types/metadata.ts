// This file exports the MetadataResult interface used in the metadata service.

export interface Author {
  name: string;
  affiliation: string;
}

export interface MetadataResult {
  title: string | null;
  abstract: string | null;
  keywords: string[];
  authors: Author[];
  doi: string | null;
  pmid: string | null;
  hasTitle: boolean;
  hasAbstract: boolean;
  keywordCount: number;
  authorCount: number;
  hasDOI: boolean;
  hasPMID: boolean;
} 