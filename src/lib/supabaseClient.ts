"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const supabaseClient = createPagesBrowserClient();

export default supabaseClient; 