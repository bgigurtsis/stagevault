
import { supabase } from "@/integrations/supabase/client";

export class BaseService {
  protected supabase = supabase;
}
