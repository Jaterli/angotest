# AnGoTest - Plataforma de Tests Online con Angular, Go e IA

![Angular](https://img.shields.io/badge/Angular-20+-red?logo=angular)
![Go](https://img.shields.io/badge/Go-1.21+-blue?logo=go)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-blue?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

**AnGoTest** es una plataforma web completa para la creación, gestión y realización de tests online. El nombre fusiona las tecnologías principales: **Angular** (frontend), **Go** (backend) y **Test** (su utilidad principal).

> 🚀 **Proyecto final de Máster en Desarrollo Web Full Stack**

---

## ✨ Características Principales

### 👥 Gestión de Usuarios
- Registro, login/logout con JWT en cookies HttpOnly
- Recuperación de contraseña por email con tokens seguros
- Tres roles: `user`, `admin`, `guest` (invitado)
- Conversión de cuenta guest a usuario permanente
- Desactivación de cuenta con anonimización de datos

### 📚 Sistema de Tests
- Jerarquía de 3 niveles: Tema Principal > Subtema > Tema Específico
- Niveles de dificultad: Principiante, Intermedio, Avanzado
- Filtrado avanzado por tema, nivel y búsqueda
- Guardado automático de progreso (tests en curso)
- Historial de tests completados con estadísticas detalladas
- Visualización de respuestas incorrectas al finalizar

### 🏆 Rankings y Gamificación
- Rankings globales por:
  - Tests completados
  - Precisión (primer intento vs. todos los intentos)
  - Tiempo por pregunta
  - Preguntas respondidas
- Rankings específicos por nivel de dificultad
- Posición actual del usuario en cada ranking
- Promedios de la comunidad para comparativa

### 🛠️ Panel de Administración
- Dashboard con KPIs y estadísticas en tiempo real
- CRUD completo de tests con editor visual
- Gestión de usuarios: ver perfiles, estadísticas, eliminar con transferencia
- Gestión de resultados: listado, filtros, eliminación individual/masiva
- Gestión de invitaciones a tests
- Configuración del sistema mediante clave-valor

### 🤖 Integración con IA (Groq)
- Generación automática de tests por IA
- Modo guiado (jerarquía existente) y modo libre (IA infiere la jerarquía)
- Soporte multi-idioma: ES, EN, FR, DE, IT, PT
- Sistema de cuotas mensuales por usuario (configurable)
- **Importación desde asistentes externos** vía JSON estructurado

### 📧 Sistema de Invitaciones
- Enlaces únicos para invitar a usuarios a tests específicos
- Soporte para usuarios invitados (guest)
- Transferencia automática de progreso al registrarse

---

## 🏗️ Arquitectura del Proyecto

```
AnGoTest/
├── frontend/                 # Aplicación Angular 20+
│   ├── src/app/
│   │   ├── core/            # Servicios, guards, interceptores
│   │   ├── shared/          # Componentes reutilizables
│   │   └── features/        # Módulos funcionales
│   │       ├── auth/        # Autenticación
│   │       ├── dashboard/   # Dashboard usuario
│   │       ├── tests/       # Tests y realización
│   │       ├── results/     # Historial y detalle
│   │       ├── rankings/    # Rankings globales
│   │       └── admin/       # Panel administración
│   └── ...
│
├── backend/                  # API en Go con Gin
│   ├── cmd/server/          # Punto de entrada
│   ├── internal/
│   │   ├── controllers/     # Handlers (admin, shared, user)
│   │   ├── middleware/      # Auth, roles, CORS
│   │   ├── models/          # Modelos GORM
│   │   └── services/        # Lógica de negocio
│   ├── pkg/
│   │   ├── config/          # Configuración DB
│   │   └── routes/          # Definición de rutas
│   └── go.mod
│
└── db/
    ├── migrations/          # Migraciones SQL
    └── seed/                # Datos iniciales
```

---

## 🛠️ Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Go | 1.21+ | Lenguaje principal |
| Gin | v1.9+ | Framework web |
| GORM | v2 | ORM para PostgreSQL |
| JWT | v5 | Autenticación |
| bcrypt | - | Hash de contraseñas |
| Groq API | - | Generación IA |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Angular | 20+ | Framework principal |
| TailwindCSS | 3+ | Estilos y diseño |
| Signals | - | Estado reactivo |
| TypeScript | 5+ | Tipado estático |

### Base de Datos
| Tecnología | Versión |
|------------|---------|
| PostgreSQL | 15+ |

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Go 1.21 o superior
- Node.js 20+ con npm/pnpm
- PostgreSQL 15+
- (Opcional) API Key de Groq para generación IA

### Backend

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/angotest.git
cd angotest/backend

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (DB, JWT, etc.)

# Instalar dependencias
go mod download

# Ejecutar migraciones
go run cmd/server/main.go migrate

# Iniciar servidor
go run cmd/server/main.go
# Servidor en http://localhost:8080
```

### Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
# Aplicación en http://localhost:4200
```

### Variables de Entorno (Backend)

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=angotest

# JWT
JWT_SECRET=tu_secret_key

# IA (Groq)
GROQ_API_KEY=tu_api_key
GROQ_MODEL=llama3-70b-8192

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu_email
SMTP_PASSWORD=tu_password
SMTP_FROM_EMAIL=noreply@angotest.com
SMTP_FROM_NAME=AnGoTest

# Entorno
ENV=development
FRONTEND_URL=http://localhost:4200
```

---

## 📋 Endpoints Principales de la API

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Inicio de sesión |
| POST | `/api/auth/logout` | Cierre de sesión |
| GET | `/api/auth/check-auth` | Verificar autenticación |

### Tests (Usuario)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/tests/:test_id` | Obtener test |
| POST | `/api/tests/:test_id/save` | Guardar progreso |
| GET | `/api/tests/not-started` | Tests no iniciados |
| GET | `/api/tests/in-progress` | Tests en progreso |
| GET | `/api/tests/completed` | Tests completados |

### Rankings
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/rankings` | Rankings globales |

### Administración
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard admin |
| POST | `/api/admin/tests/create` | Crear test |
| PUT | `/api/admin/tests/:id/edit` | Editar test |
| DELETE | `/api/admin/tests/:id/delete` | Eliminar test |
| GET | `/api/admin/users/stats` | Listar usuarios |
| DELETE | `/api/admin/users/:id/delete` | Eliminar usuario |

### IA
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ai-requests/generate-ai-test` | Generar test con IA |
| GET | `/api/ai-requests/quota` | Consultar cuota |

---

## 🧪 Ejemplo de Importación JSON desde Asistente IA

Cualquier asistente de IA externo puede generar tests para AnGoTest siguiendo esta estructura:

```json
{
  "title": "El Sistema Solar",
  "description": "Test sobre planetas y características del sistema solar",
  "main_topic": "Astronomía",
  "sub_topic": "Sistema Solar",
  "specific_topic": "Planetas",
  "questions": [
    {
      "question_text": "¿Cuál es el planeta más cercano al Sol?",
      "answers": [
        { "answer_text": "Mercurio", "is_correct": true },
        { "answer_text": "Venus", "is_correct": false },
        { "answer_text": "Tierra", "is_correct": false },
        { "answer_text": "Marte", "is_correct": false }
      ]
    }
  ]
}
```

**Prompt sugerido:**
> *"Genera un test de 10 preguntas sobre [tema] para nivel [principiante/intermedio/avanzado] con 4 opciones cada una, en formato JSON compatible con AnGoTest"*

---

## 📸 Capturas de Pantalla

> *[Aquí puedes añadir capturas de tu aplicación: dashboard, realización de test, rankings, panel admin, etc.]*

---

## 🗺️ Hoja de Ruta

### ✅ Completado
- [x] Autenticación JWT con cookies HttpOnly
- [x] CRUD completo de tests
- [x] Sistema de progreso y resultados
- [x] Rankings globales y por nivel
- [x] Panel de administración con dashboard
- [x] Generación de tests con IA (Groq)
- [x] Sistema de invitaciones
- [x] Gestión de cuotas de IA
- [x] Modo oscuro

### 🔄 En desarrollo
- [ ] Tests colaborativos (varios administradores)
- [ ] Exportación de resultados a PDF/CSV
- [ ] WebSockets para notificaciones en tiempo real

### 📅 Planificado
- [ ] API pública para desarrolladores
- [ ] Modo examen con temporizador por pregunta
- [ ] Sistema de logros y gamificación avanzada
- [ ] Docker y Kubernetes para despliegue

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 📧 Contacto

**Autor:** Jaime TL

- GitHub: [@jaterli](https://github.com/jaterli)
- Email: jaime@angotest.com

---

## 🙏 Agradecimientos

- [Angular](https://angular.dev/) - Framework frontend
- [Gin](https://gin-gonic.com/) - Framework web para Go
- [GORM](https://gorm.io/) - ORM para Go
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS
- [Groq](https://groq.com/) - API de IA para generación de tests

---

⭐ **Si te gusta este proyecto, no olvides darle una estrella en GitHub.**