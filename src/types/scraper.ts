export interface SearchParams {
  query: string;
  countryCode: string;
  tld: string;
  language: string;
}

export interface HeadingData {
  tag: string;
  text: string;
}

export interface ScrapedPageInfo {
  title: string;
  meta_description: string;
  headings: HeadingData[];
}

export interface SearchResult {
  url: string;
  title: string;
  title_scrapped?: string;
  meta_description_scrapped?: string;
  headings: HeadingData[];
  isLoading?: boolean;
}

export interface ScrapingResults {
  organic_results: SearchResult[];
  query: string;
  timestamp: string;
}