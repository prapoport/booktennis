-- Add new houses if they don't exist
INSERT INTO houses (name) VALUES
  ('Casa Coco'),
  ('Casa del Mar'),
  ('Casa Staa'),
  ('Casa Hola Ola'),
  ('Hamui'),
  ('Casa NumaNa'),
  ('Casa Naila del Mar'),
  ('Casa Tortuga'),
  ('Casa Cova')
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- Deactivate houses that are not in the current list
UPDATE houses 
SET is_active = false
WHERE name NOT IN (
  'Casa Coco',
  'Casa del Mar',
  'Casa Staa',
  'Casa Hola Ola',
  'Hamui',
  'Casa NumaNa',
  'Casa Naila del Mar',
  'Casa Tortuga',
  'Casa Cova'
);
