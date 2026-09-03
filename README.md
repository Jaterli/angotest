# AngoTest

**Plataforma educativa para la creación, gestión y realización de tests online con inteligencia artificial**

![Angular](https://img.shields.io/badge/Angular-20+-red?logo=angular)
![Django](https://img.shields.io/badge/Django-5.2+-darkgreen?logo=django)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-blue?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)
---

Este repositorio contiene el desarrollo completo de **AngoTest**, una aplicación web full stack presentada como proyecto final del **Máster en Desarrollo Web Full Stack**. La aplicación combina un frontend en **Angular** con un backend en **Django REST Framework**, integrando funcionalidades avanzadas como generación de tests mediante IA, gestión de cuotas, invitaciones y análisis de resultados.

---

## 👨‍🏫 Guía para el Evaluador del PFM

Para facilitar la evaluación completa de todas las funcionalidades de la aplicación, se han creado los siguientes datos de prueba:

### 🔑 Credenciales de Administrador (superusuario de Django)

| Campo | Valor |
|-------|-------|
| **Email** | `admin@angotest.com` |
| **Contraseña** | `13113013@WfX` |

### 🔑 Credenciales de usuario

| Campo | Valor |
|-------|-------|
| **Email** | `test_user_11@example.com` *|
| **Contraseña** | `test123` |

### 📚 Datos de Prueba

La base de datos incluye datos de ejemplo precargados para que puedas explorar la aplicación sin necesidad de crearlos manualmente:

- **Tests de ejemplo:** Varios tests completos con preguntas y respuestas en diferentes niveles de dificultad y temáticas.
- **Usuarios de prueba:** Cuentas adicionales con diferentes roles y progreso para visualizar rankings y estadísticas.
- **Resultados históricos:** Datos de tests completados para probar el dashboard y los rankings globales.

---

## 🚀 Descripción

AngoTest es una plataforma educativa que permite a los usuarios:

- Registrarse e iniciar sesión (con autenticación JWT vía cookies HttpOnly).
- Realizar tests de opción múltiple con seguimiento de progreso.
- Visualizar estadísticas personales y compararse en rankings globales.
- Generar tests automáticamente mediante **inteligencia artificial** (integrando la API de Groq).
- Invitar a otros usuarios (o invitados) a realizar tests mediante enlaces únicos.
- Gestionar cuotas mensuales para limitar el uso de la IA.
- Administrar usuarios, tests, resultados, invitaciones y configuraciones del sistema a través de un panel de administración completo.

---

## ✨ Características principales

### Para usuarios estándar (`user`)
- **Dashboard personal** con estadísticas detalladas (primeros intentos, todos los intentos, desglose por nivel).
- **Rankings globales** por cantidad de tests, precisión, tiempo por pregunta y preguntas respondidas.
- **Gestión de tests**:
  - Listado de tests disponibles, en progreso y completados.
  - Realización de tests con guardado automático de progreso.
  - Visualización de resultados detallados (pregunta por pregunta).
- **Generación de tests con IA** (modo guiado por temas, con cuota mensual).
- **Envío de invitaciones** a tests completados (enlace único con expiración).
- **Gestión de perfil**: actualización de datos, cambio de email/contraseña, desactivación de cuenta.

### Para usuarios invitados (`guest`)
- Acceso limitado a tests en progreso y completados.
- Posibilidad de completar el perfil para convertirse en usuario estándar.

### Para administradores (`admin`)
- **Dashboard global** con métricas de toda la plataforma (totales, tests destacados, actividad de usuarios).
- **Gestión de usuarios**: listado, visualización de perfil, eliminación con transferencia de datos.
- **Gestión de tests**: creación manual, desde JSON o con IA; edición (con advertencia de modificación), eliminación y estadísticas detalladas.
- **Gestión de resultados**: listado global, filtros avanzados, visualización detallada, eliminación individual/masiva y exportación a CSV.
- **Gestión de invitaciones**: listado, creación, eliminación y estadísticas.
- **Gestión de cuotas**: control de límites mensuales de generación con IA, creación/edición/eliminación de cuotas, exportación a CSV y estadísticas.
- **Configuración del sistema**: gestión de parámetros clave (límite de IA, días de expiración, ID de usuario contenedor, etc.).
- **Registros de solicitudes de IA**: auditoría de todas las generaciones.
- **Panel de administración de Django**: Acceso a la interfaz nativa de Django en `/django-admin` para gestión avanzada de la base de datos.

---

## 🛠️ Tecnologías utilizadas

### Frontend
- **Angular 20** (standalone components, signals, reactive forms)
- **TailwindCSS 4** (diseño responsive y modo oscuro)
- **TypeScript 5.9**
- **RxJS** (manejo de estado reactivo)

### Backend
- **Django 5.0** con **Django REST Framework 3.14**
- **Autenticación JWT** con cookies HttpOnly (personalizada)
- **PostgreSQL** como base de datos
- **Django ORM** con migraciones
- **Caché** (LocMemCache, con soporte para Redis en producción)
- **Integración con IA**: API de **Groq** (modelo `openai/gpt-oss-120b` en agosto de 2026)

### Otras herramientas
- **drf-spectacular** para documentación OpenAPI (Swagger)
- **django-cors-headers** para CORS
- **django-filter** para filtros avanzados
- **django-erd-generator** para diagramas ER (opcional)

---

## 📦 Requisitos previos

- **Node.js** (v20 o superior)
- **Python** (v3.10 o superior)
- **PostgreSQL** (v14 o superior)
- **Git**

---

## 🔧 Instalación y ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/jaterli/angotest.git
cd angotest
```

### 2. Backend (Django)

#### 2.1. Crear y activar entorno virtual
```bash
cd backend
python -m venv venv
source venv/bin/activate   # En Windows: venv\Scripts\activate
```

#### 2.2. Instalar dependencias
```bash
pip install -r requirements.txt
```

#### 2.3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del backend con el siguiente contenido (ajusta los valores):
```env
# Django settings for AngoTest project
DEBUG=True
ENV=development
SITE_URL=localhost:4200  # Cambiar por el dominio en producción (ej: angotest.com)
DJANGO_SECRET_KEY='tu-clave-secreta-django'  # Generar una clave segura

ALLOWED_HOSTS=localhost,127.0.0.1,tu-dominio.com,www.tu-dominio.com,angotest_backend,angotest_backend:8000
CORS_ALLOWED_ORIGINS=https://tu-dominio.com,http://tu-dominio.com,http://localhost:4200,http://localhost:8000,http://127.0.0.1:8000
CSRF_TRUSTED_ORIGINS=https://tu-dominio.com,http://tu-dominio.com,http://localhost:4200,http://localhost:8000

# Database configuration
DB_HOST=localhost  # Cambiar por angotest_db en producción con Docker
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu-contraseña-postgres
DB_NAME=angotest_db

# JWT configuration
JWT_SECRET='tu-jwt-secret'  # Generar un secreto seguro para JWT

# Redis (opcional, para caché y sesiones)
REDIS_HOST=localhost  # Cambiar por angotest_redis en producción con Docker
REDIS_PORT=6379
REDIS_DB=1

# AI configuration
GROQ_BASE_URL='https://api.groq.com/openai/v1/chat/completions'
GROQ_API_KEY='tu-api-key-de-groq'  # Obtener de https://console.groq.com
GROQ_MODEL='openai/gpt-oss-120b'  # Modelo a utilizar
AI_MAX_TOKENS=8000
AI_TEMPERATURE=0.5
AI_TIMEOUT=60

# Email configuration
EMAIL_HOST=smtp.gmail.com  # Cambiar por tu proveedor de email
EMAIL_PORT=587
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-contraseña-app  # Usar contraseña de aplicación para Gmail
DEFAULT_FROM_EMAIL='soporte@tu-dominio.com'
EMAIL_FROM_NAME=AngoTest
```

#### 2.4. Ejecutar migraciones y crear superusuario
```bash
python manage.py migrate
python manage.py createsuperuser
```

#### 2.5. Iniciar el servidor backend
```bash
python manage.py runserver
```
El backend estará disponible en `http://localhost:8000`.

---

### 3. Frontend (Angular)

#### 3.1. Instalar dependencias
```bash
cd ../frontend
npm install
```

#### 3.2. Configurar variables de entorno
Crea `src/environments/environment.ts` (y `environment.prod.ts`) con:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

#### 3.3. Iniciar el servidor de desarrollo
```bash
npm start
```
El frontend estará disponible en `http://localhost:4200`.

---

## 📁 Estructura del proyecto

### Backend (Django)
```
backend/
├── angotest/                # Configuración del proyecto
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── accounts/            # Autenticación, perfiles, rankings
│   ├── admin_panel/         # Gestión de cuotas, configuraciones, dashboard
│   ├── ai/                  # Generación de tests con IA
│   ├── invitations/         # Invitaciones a tests
│   ├── results/             # Resultados de tests
│   ├── shared/              # Temas (jerarquía), utilidades comunes
│   ├── test/                # Tests, preguntas, respuestas
│   └── docs/                # Plantillas de documentación
├── requirements.txt
└── manage.py
```

### Frontend (Angular)
```
frontend/
├── src/
│   ├── app/
│   │   ├── admin/               # Módulo de administración
│   │   │   ├── admin-dashboard/
│   │   │   ├── tests/
│   │   │   ├── users/
│   │   │   ├── results/
│   │   │   ├── invitations-management/
│   │   │   ├── quota-management/
│   │   │   └── system-config/
│   │   ├── shared/              # Componentes y servicios compartidos
│   │   │   ├── components/      # Navbar, modal, forbidden, etc.
│   │   │   ├── services/        # Auth, temas, utilidades, etc.
│   │   │   └── models/
│   │   ├── guards/              # Guards de autenticación y roles
│   │   ├── interceptors/        # Interceptor para credenciales
│   │   └── app-routing.module.ts
│   ├── assets/
│   ├── environments/
│   ├── styles.scss
│   └── index.html
├── angular.json
├── package.json
└── tailwind.config.js
```

---

## 📖 Documentación de la API

La API está documentada automáticamente con **drf-spectacular**. Una vez levantado el backend, puedes acceder a:

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **Esquema OpenAPI**: `http://localhost:8000/api/schema/`

---

## 🧪 Pruebas

### Backend
```bash
python manage.py test
```

### Frontend
```bash
ng test
```

---

## 🤝 Contribución

Este proyecto es parte de un trabajo académico, pero se aceptan sugerencias y mejoras. Si deseas contribuir:

1. Haz un fork del repositorio.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'Añadir nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más información.

---

## 🙏 Agradecimientos

- **Máster en Desarrollo Web Full Stack** – por proporcionar los conocimientos y el entorno para desarrollar este proyecto.
- **Profesores y tutores** – por su guía y apoyo durante todo el proceso.
- **Comunidad open source** – por las herramientas y librerías que hicieron posible este trabajo.

---

## 📧 Contacto

Para cualquier consulta, puedes escribir a:  
**soporte@angotest.com** (correo de contacto del proyecto)

---

*Última actualización: agosto de 2026*