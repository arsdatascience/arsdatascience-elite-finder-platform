-- Migration: Fix Permissions and Profile Fields
-- 1. Create Permissions Table if not exists
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Role Permissions Table if not exists
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- 3. Add username to users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
    ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
  END IF;
END $$;

-- 4. Add extended fields to user_profiles table
DO $$ 
BEGIN
  -- Personal Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='last_name') THEN
    ALTER TABLE user_profiles ADD COLUMN last_name VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='cpf') THEN
    ALTER TABLE user_profiles ADD COLUMN cpf VARCHAR(20);
  END IF;

  -- Address Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='address_street') THEN
    ALTER TABLE user_profiles ADD COLUMN address_street VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='address_number') THEN
    ALTER TABLE user_profiles ADD COLUMN address_number VARCHAR(20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='address_city') THEN
    ALTER TABLE user_profiles ADD COLUMN address_city VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='address_district') THEN
    ALTER TABLE user_profiles ADD COLUMN address_district VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='address_state') THEN
    ALTER TABLE user_profiles ADD COLUMN address_state VARCHAR(2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='address_zip') THEN
    ALTER TABLE user_profiles ADD COLUMN address_zip VARCHAR(20);
  END IF;
END $$;

-- 5. Insert Default Permissions
INSERT INTO permissions (name, description) VALUES
('view_dashboard', 'Visualizar Dashboard'),
('manage_campaigns', 'Gerenciar Campanhas'),
('manage_leads', 'Gerenciar Leads'),
('manage_team', 'Gerenciar Equipe'),
('manage_settings', 'Gerenciar Configurações'),
('view_reports', 'Visualizar Relatórios'),
('export_data', 'Exportar Dados')
ON CONFLICT (name) DO NOTHING;

-- 6. Assign Permissions to Roles (Safe Insert)
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- User gets specific permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.name = 'User' AND p.name IN ('view_dashboard', 'manage_campaigns', 'manage_leads', 'view_reports')
ON CONFLICT DO NOTHING;
