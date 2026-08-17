-- ============================================
-- INSERCIÓN DE NUEVOS TEMAS (CON FECHAS)
-- ============================================

BEGIN;

-- 1. Nuevos subtopics para Programación
INSERT INTO topics (main_topic, sub_topic, specific_topic, is_predefined, created_at, updated_at) VALUES
('Programación', 'Python', 'Django Framework', false, NOW(), NOW()),
('Programación', 'Python', 'Flask Framework', false, NOW(), NOW()),
('Programación', 'Python', 'FastAPI', false, NOW(), NOW()),
('Programación', 'JavaScript', 'React', false, NOW(), NOW()),
('Programación', 'JavaScript', 'Vue.js', false, NOW(), NOW()),
('Programación', 'JavaScript', 'Angular', false, NOW(), NOW()),
('Programación', 'Java', 'Spring Boot', false, NOW(), NOW()),
('Programación', 'Java', 'Hibernate', false, NOW(), NOW());

-- 2. Nuevos subtopics para Bases de Datos
INSERT INTO topics (main_topic, sub_topic, specific_topic, is_predefined, created_at, updated_at) VALUES
('Bases de Datos', 'PostgreSQL', 'Índices', false, NOW(), NOW()),
('Bases de Datos', 'PostgreSQL', 'Optimización de consultas', false, NOW(), NOW()),
('Bases de Datos', 'PostgreSQL', 'Particionamiento', false, NOW(), NOW()),
('Bases de Datos', 'MySQL', 'InnoDB Engine', false, NOW(), NOW()),
('Bases de Datos', 'MySQL', 'Replicación', false, NOW(), NOW());

-- 3. Nuevos subtopics para DevOps
INSERT INTO topics (main_topic, sub_topic, specific_topic, is_predefined, created_at, updated_at) VALUES
('DevOps', 'Docker', 'Docker Compose', false, NOW(), NOW()),
('DevOps', 'Kubernetes', 'Pods y Servicios', false, NOW(), NOW()),
('DevOps', 'Kubernetes', 'Ingress Controllers', false, NOW(), NOW()),
('DevOps', 'CI/CD', 'Jenkins Pipelines', false, NOW(), NOW()),
('DevOps', 'CI/CD', 'GitHub Actions', false, NOW(), NOW());

-- 4. Verificar inserción
SELECT main_topic, sub_topic, COUNT(*) as total_temas 
FROM topics 
GROUP BY main_topic, sub_topic
ORDER BY main_topic, sub_topic;

COMMIT;