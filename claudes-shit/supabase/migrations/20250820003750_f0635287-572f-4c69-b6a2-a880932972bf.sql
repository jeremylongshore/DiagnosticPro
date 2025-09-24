-- Manually trigger the analysis and email sending for the paid diagnostic
SELECT functions.invoke_function(
  'analyze-diagnostic',
  '{"submissionId": "bc542dc1-d1e8-4ec4-86f4-e9a97eb0c879"}'::jsonb
);

-- Then trigger the email sending
SELECT functions.invoke_function(
  'send-diagnostic-email', 
  '{
    "to": "jeremylongshore@gmail.com",
    "customerName": "Jeremy",
    "analysis": "Professional AI analysis of your Nissan Titan diagnostic will be generated",
    "submissionId": "bc542dc1-d1e8-4ec4-86f4-e9a97eb0c879"
  }'::jsonb
);