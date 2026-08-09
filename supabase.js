import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://mreqwrdkucggwvxvturl.supabase.co";

const supabaseKey = "sb_publishable_5wGX_HMaRoWb63uDX6hRyw_gxwm4JCR";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
