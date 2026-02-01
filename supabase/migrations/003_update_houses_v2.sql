-- Rename existing houses if they exist (preserves history)
UPDATE houses SET name = 'Casa Rhino' WHERE name = 'Casa Tortuga';
UPDATE houses SET name = 'Casa Hamui' WHERE name = 'Hamui';

-- Insert all current houses to ensure they exist
INSERT INTO houses (name) VALUES
  ('Casa Cereza'),
  ('Casa Coco'),
  ('Casa Cova'),
  ('Casa del Mar'),
  ('Casa Hamui'),
  ('Casa Hola Ola'),
  ('Casa Naila del Mar'),
  ('Casa Navari'),
  ('Casa NumaNa'),
  ('Casa Rhino'),
  ('Casa Siano'),
  ('Casa Staa')
ON CONFLICT (name) DO UPDATE SET is_active = true;

-- Deactivate houses that are not in the current list
UPDATE houses 
SET is_active = false
WHERE name NOT IN (
  'Casa Cereza',
  'Casa Coco',
  'Casa Cova',
  'Casa del Mar',
  'Casa Hamui',
  'Casa Hola Ola',
  'Casa Naila del Mar',
  'Casa Navari',
  'Casa NumaNa',
  'Casa Rhino',
  'Casa Siano',
  'Casa Staa'
);
