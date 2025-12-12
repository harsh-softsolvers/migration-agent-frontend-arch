import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAnalysisStore } from '~/store/analysisSlice';
import { useTemplateStore } from '~/store/templateSlice';
import { useWorkflowStore } from '~/store/workflowSlice';
import { config } from '~/config';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { Badge } from '~/components/ui/badge';
import { FileText, Loader, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import type { TemplateMatchResponse } from '~/store/templateSlice';

export function meta() {
  return [
    { title: 'Template Selection - Excel Migration Tool' },
    { name: 'description', content: 'Select the appropriate template for your data' },
  ];
}

function getConfidenceColor(confidence: string): string {
  switch (confidence.toLowerCase()) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getMatchStrategyColor(strategy: string): string {
  if (strategy === 'exact') {
    return 'bg-blue-100 text-blue-800';
  }
  if (strategy === 'fuzzy') {
    return 'bg-purple-100 text-purple-800';
  }
  return 'bg-gray-100 text-gray-800';
}

export default function TemplateSelection() {
  const navigate = useNavigate();
  const analysisData = useAnalysisStore((state) => state.analysisData);
  const templateStore = useTemplateStore();
  const workflowStore = useWorkflowStore();
  const [uploadColumns, setUploadColumns] = useState<string[]>([]);

  // Enable workflow progress and set current step on mount
  useEffect(() => {
    workflowStore.setShowProgress(true);
    workflowStore.setCurrentStep('template');
  }, []);

  // If no analysis data, redirect back
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Analysis Data</CardTitle>
            <CardDescription>Please complete file analysis first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/upload-preview')} className="w-full">
              Go Back to Preview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the first sheet's original headers
  const firstSheet = Object.values(analysisData.sheets)[0];
  const headerInfo = firstSheet?.header_info?.original_headers || [];

  // Set upload columns on mount or when analysis data changes
  useEffect(() => {
    if (headerInfo.length > 0) {
      setUploadColumns(headerInfo);
    }
  }, [analysisData]);

  // Fetch template matches
  const templateMutation = useMutation({
    mutationFn: async (): Promise<TemplateMatchResponse> => {
      const endpoint = `${config.api.baseUrl}/api/v1/templates/match`;
      const sessionId = analysisData.session_id;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          uploaded_columns: uploadColumns,
          top_n: 5,
          min_confidence_score: 0.6,
          fuzzy_threshold: 0.8,
        }),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          error: errorData.error || 'Unknown error',
          message: errorData.message || 'Failed to fetch templates',
        };
      }

      return await response.json();
    },
    onSuccess: (data) => {
      templateStore.setTemplateData(data);
      if (data.matches_found === 0) {
        toast.warning('No templates matched', {
          description: 'No suitable templates found for your data',
        });
      } else {
        toast.success(`Found ${data.matches_found} template(s)`, {
          description: `Showing top ${Math.min(data.matches.length, 5)} matches`,
        });
      }
    },
    onError: (error: any) => {
      const errorMsg = error.message || 'Failed to fetch templates';
      templateStore.setError(errorMsg);
      toast.error('Template search failed', { description: errorMsg });
    },
  });

  // Load templates on mount
  useEffect(() => {
    if (headerInfo.length > 0) {
      templateStore.setIsLoading(true);
      templateMutation.mutate();
    }
  }, [headerInfo.length]);

  const handleSelectTemplate = () => {
    if (!templateStore.selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    // TODO: Redirect to field mapping or column configuration page
    toast.success('Template selected', {
      description: `Selected: ${templateStore.selectedTemplate.template_name}`,
    });
    navigate('/field-mapping');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FileText className="w-16 h-16 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Template Selection</h1>
          <p className="text-gray-600">
            Select the most appropriate template for your uploaded Excel file
          </p>
        </div>

        {/* Uploaded Columns Info */}
        {/* {uploadColumns.length > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <FileText className="w-5 h-5" />
                Detected Columns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {uploadColumns.map((col, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                    {col}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-blue-700 mt-4">
                Total: <span className="font-semibold">{uploadColumns.length} columns</span>
              </p>
            </CardContent>
          </Card>
        )} */}

        {/* Loading State */}
        {templateMutation.isPending && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Loader className="w-5 h-5 animate-spin" />
                Searching Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <p>Finding the most relevant templates for your data...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {templateStore.error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="w-5 h-5" />
                Search Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-red-800">
              <p>{templateStore.error}</p>
              <Button
                onClick={() => templateMutation.mutate()}
                variant="outline"
                className="mt-4"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Matches State */}
        {templateStore.templateData &&
          templateStore.templateData.matches_found === 0 &&
          !templateMutation.isPending && (
            <Card className="mb-6 bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900">
                  <AlertCircle className="w-5 h-5" />
                  No Templates Found
                </CardTitle>
              </CardHeader>
              <CardContent className="text-yellow-800">
                <p>
                  No templates matched your uploaded columns. You can still proceed with custom
                  mapping.
                </p>
                <Button variant="outline" className="mt-4">
                  Create Custom Template
                </Button>
              </CardContent>
            </Card>
          )}

        {/* Templates List */}
        {templateStore.templateData && templateStore.templateData.matches_found > 0 && (
          <div className="space-y-4 mb-8">
            {templateStore.templateData.matches.map((template, idx) => (
              <Card
                key={template.template_id}
                className={`cursor-pointer transition-all ${
                  templateStore.selectedTemplate?.template_id === template.template_id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => templateStore.setSelectedTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                        {templateStore.selectedTemplate?.template_id === template.template_id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        Template ID: <span className="font-mono">{template.template_id}</span>
                        {' • '}
                        Version: {template.version}
                      </CardDescription>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold text-blue-600">
                        {Math.round(template.overall_match_score * 100)}%
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Match Score</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Match Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium">Field Match</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {template.field_match_percentage}%
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium">Columns Matched</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {template.matched_columns}/{template.total_columns}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium">Confidence</p>
                      <Badge className={`mt-2 ${getConfidenceColor(template.confidence_level)}`}>
                        {template.confidence_level}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium">Format Type</p>
                      <Badge variant="outline" className="mt-2">
                        {template.format_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Column Matches Accordion */}
                  <Accordion type="single" collapsible className="border rounded-lg">
                    <AccordionItem value="column-matches" className="border-none">
                      <AccordionTrigger className="hover:no-underline px-4 py-3 bg-gray-50 hover:bg-gray-100">
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Column Mappings</p>
                          <p className="text-sm text-gray-600">
                            {template.column_matches.length} columns matched
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-3 bg-white">
                        <div className="space-y-3">
                          {template.column_matches.map((match, midx) => (
                            <div
                              key={midx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {match.uploaded_column}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  Maps to:{' '}
                                  <span className="font-mono text-blue-600">
                                    {match.template_column_name}
                                  </span>
                                </p>
                              </div>
                              <div className="text-right shrink-0 ml-4">
                                <Badge
                                  className={`${getMatchStrategyColor(match.match_strategy)}`}
                                >
                                  {match.match_strategy}
                                </Badge>
                                <p className="text-xs text-gray-600 mt-2">
                                  {Math.round(match.confidence * 100)}%
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Unmatched Columns */}
                          {template.unmatched_template_columns.length > 0 && (
                            <div className="pt-3 border-t">
                              <p className="text-sm font-medium text-gray-900 mb-2">
                                Missing Columns
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {template.unmatched_template_columns.map((col, cidx) => (
                                  <Badge key={cidx} variant="outline" className="text-orange-700">
                                    {col}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Matching Metadata */}
                  <Accordion type="single" collapsible className="border rounded-lg">
                    <AccordionItem value="metadata" className="border-none">
                      <AccordionTrigger className="hover:no-underline px-4 py-3 bg-gray-50 hover:bg-gray-100">
                        <p className="font-semibold text-gray-900">Matching Details</p>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-3 bg-white">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fuzzy Threshold:</span>
                            <span className="font-medium">
                              {template.matching_metadata.fuzzy_threshold}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Columns Analyzed:</span>
                            <span className="font-medium">
                              {template.matching_metadata.columns_analyzed}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Strategies Used:</span>
                            <span className="font-medium">
                              {template.matching_metadata.match_strategies_used.join(', ')}
                            </span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <Button
            variant="default"
            size="lg"
            onClick={handleSelectTemplate}
            disabled={!templateStore.selectedTemplate || templateMutation.isPending}
            className="gap-2"
          >
            {templateStore.selectedTemplate && (
              <>
                Continue to Field Mapping
                <ArrowRight className="w-4 h-4" />
              </>
            )}
            {!templateStore.selectedTemplate && 'Select a Template'}
          </Button>
          <Button
            onClick={() => navigate('/upload-preview')}
            variant="outline"
            size="lg"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
