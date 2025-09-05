import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('chatgpt');

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    console.log('Analyzing malicious complainants...');

    // Get all complaints with embeddings
    const { data: complaints, error: complaintsError } = await supabase
      .from('civilcomplaint')
      .select('civilianid, title, request_content, request_content_embedding, created_at')
      .not('request_content_embedding', 'is', null)
      .order('created_at', { ascending: false });

    if (complaintsError) {
      throw complaintsError;
    }

    console.log(`Found ${complaints?.length || 0} complaints with embeddings`);

    // Group complaints by civilianid and analyze similarity
    const complainantGroups: { [key: string]: any[] } = {};
    
    complaints?.forEach(complaint => {
      const id = complaint.civilianid.toString();
      if (!complainantGroups[id]) {
        complainantGroups[id] = [];
      }
      complainantGroups[id].push(complaint);
    });

    const maliciousComplaintants: any[] = [];

    // Analyze each complainant group
    for (const [civilianid, groupComplaints] of Object.entries(complainantGroups)) {
      if (groupComplaints.length >= 3) {
        // Calculate similarity between complaints
        let similarCount = 0;
        
        for (let i = 0; i < groupComplaints.length; i++) {
          for (let j = i + 1; j < groupComplaints.length; j++) {
            const complaint1 = groupComplaints[i];
            const complaint2 = groupComplaints[j];
            
            if (complaint1.request_content_embedding && complaint2.request_content_embedding) {
              // Use a simplified similarity check (this would need actual vector similarity calculation)
              // For demo purposes, we'll check text similarity
              const similarity = calculateTextSimilarity(
                complaint1.request_content,
                complaint2.request_content
              );
              
              if (similarity >= 0.7) {
                similarCount++;
              }
            }
          }
        }

        // If 3+ similar complaints, mark as malicious
        if (similarCount >= 3) {
          const latestComplaint = groupComplaints.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          maliciousComplaintants.push({
            civilianid: parseInt(civilianid),
            complaint_count: groupComplaints.length,
            latest_date: latestComplaint.created_at,
            status: similarCount >= 5 ? '경고' : '모니터링'
          });
        }
      }
    }

    console.log(`Found ${maliciousComplaintants.length} malicious complainants`);

    // Calculate statistics
    const statistics = {
      totalMalicious: maliciousComplaintants.length,
      totalRepeats: maliciousComplaintants.reduce((sum, c) => sum + c.complaint_count, 0),
      timeSaved: maliciousComplaintants.length * 32 // Estimate 32 hours saved per malicious complainant
    };

    return new Response(JSON.stringify({
      maliciousComplaintants,
      statistics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-malicious-complainants:', error);
    return new Response(JSON.stringify({
      error: error.message,
      maliciousComplaintants: [],
      statistics: { totalMalicious: 0, totalRepeats: 0, timeSaved: 0 }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simple text similarity calculation (Jaccard similarity)
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}