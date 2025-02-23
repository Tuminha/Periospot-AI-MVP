import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DentalAnalysisResultsProps {
  analysis: {
    studyType: string;
    methodology: {
      type: string;
      description: string;
      concerns?: string[];
    };
    statistics: {
      methods: string[];
      appropriateness: boolean;
      concerns?: string[];
    };
    clinicalRelevance: {
      score: number;
      explanation: string;
      implications: string[];
    };
    evidenceLevel: {
      level: string;
      description: string;
    };
    perio: {
      relevantConditions: string[];
      treatments: string[];
      outcomes: string[];
    };
  };
  statisticalValidation: {
    isValid: boolean;
    concerns: string[];
    suggestions: string[];
  };
  perioRelevance: {
    relevanceScore: number;
    conditions: string[];
    clinicalImplications: string[];
    researchGaps: string[];
  };
  methodologyQuality: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

export function DentalAnalysisResults({
  analysis,
  statisticalValidation,
  perioRelevance,
  methodologyQuality,
}: DentalAnalysisResultsProps) {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Research Overview</CardTitle>
          <CardDescription>Key findings and analysis results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Study Type:</span>
              <Badge variant="outline">{analysis.studyType}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Evidence Level:</span>
              <Badge variant="outline">{analysis.evidenceLevel.level}</Badge>
            </div>
            <div className="space-y-2">
              <span className="font-medium">Clinical Relevance Score:</span>
              <Progress value={analysis.clinicalRelevance.score * 10} />
              <p className="text-sm text-muted-foreground">
                {analysis.clinicalRelevance.explanation}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Accordion */}
      <Accordion type="single" collapsible className="w-full">
        {/* Methodology Section */}
        <AccordionItem value="methodology">
          <AccordionTrigger>Methodology Analysis</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Type: {analysis.methodology.type}</h4>
                <p className="text-sm text-muted-foreground">
                  {analysis.methodology.description}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Quality Score:</h4>
                <Progress value={methodologyQuality.score * 10} className="mt-2" />
              </div>
              <div>
                <h4 className="font-medium">Strengths:</h4>
                <ul className="list-disc list-inside text-sm">
                  {methodologyQuality.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Areas for Improvement:</h4>
                <ul className="list-disc list-inside text-sm">
                  {methodologyQuality.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Statistical Analysis Section */}
        <AccordionItem value="statistics">
          <AccordionTrigger>Statistical Analysis</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Methods Used:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.statistics.methods.map((method, index) => (
                    <Badge key={index} variant="secondary">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium">Validation:</h4>
                <Badge
                  variant={statisticalValidation.isValid ? "success" : "destructive"}
                  className="mt-2"
                >
                  {statisticalValidation.isValid ? "Valid" : "Concerns Found"}
                </Badge>
              </div>
              {statisticalValidation.concerns.length > 0 && (
                <div>
                  <h4 className="font-medium">Concerns:</h4>
                  <ul className="list-disc list-inside text-sm">
                    {statisticalValidation.concerns.map((concern, index) => (
                      <li key={index}>{concern}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Periodontal Relevance Section */}
        <AccordionItem value="perio">
          <AccordionTrigger>Periodontal Relevance</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Relevance Score:</h4>
                <Progress value={perioRelevance.relevanceScore * 10} className="mt-2" />
              </div>
              <div>
                <h4 className="font-medium">Conditions:</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {perioRelevance.conditions.map((condition, index) => (
                    <Badge key={index} variant="outline">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium">Clinical Implications:</h4>
                <ul className="list-disc list-inside text-sm">
                  {perioRelevance.clinicalImplications.map((implication, index) => (
                    <li key={index}>{implication}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Research Gaps:</h4>
                <ul className="list-disc list-inside text-sm">
                  {perioRelevance.researchGaps.map((gap, index) => (
                    <li key={index}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 