
-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  canteen_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view menu items"
  ON public.menu_items FOR SELECT
  USING (true);

-- Public insert/update/delete for admin (no auth in original app)
CREATE POLICY "Anyone can insert menu items"
  ON public.menu_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update menu items"
  ON public.menu_items FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete menu items"
  ON public.menu_items FOR DELETE
  USING (true);
