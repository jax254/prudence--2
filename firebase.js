import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://mreqwrdkucggwvxvturl.supabase.co";

const supabaseKey = "YOUR_SB_PUBLISHABLE_KEY";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
