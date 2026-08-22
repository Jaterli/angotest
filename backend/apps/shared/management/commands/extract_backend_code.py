# management/commands/extract_code.py

import os
import re
from pathlib import Path
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import fnmatch


class Command(BaseCommand):
    """
    Comando Django para extraer código de archivos .py y .html específicos
    Uso: python manage.py extract_code [opciones]
    """
    
    help = 'Extrae el contenido de archivos .py y .html del proyecto Django'
    
    # Directorios a ignorar (siempre)
    IGNORE_DIRS = [
        '__pycache__',
        'venv',
        'env',
        'node_modules',
        '.git',
        '.pytest_cache',
        '.coverage',
        'htmlcov',
        'dist',
        'build',
        '*.egg-info',
        '.idea',
        '.vscode',
        'media',
        'staticfiles',
    ]
    
    # Archivos a ignorar (siempre)
    IGNORE_FILES = [
        'manage.py',
        'admin.py',
        'wsgi.py',
        'asgi.py',
        '__init__.py',
        'conftest.py',
        'setup.py',
        'tox.ini',
        'pytest.ini',
        'conftest.py',
        'test_*.py',
        '*_test.py',
    ]
    
    def add_arguments(self, parser):
        """
        Añade argumentos para el comando
        """
        # Grupos de argumentos
        include_group = parser.add_argument_group('Inclusión de archivos')
        exclude_group = parser.add_argument_group('Exclusión de archivos')
        output_group = parser.add_argument_group('Opciones de salida')
        
        # Argumentos de inclusión
        include_group.add_argument(
            '--include',
            '-i',
            nargs='+',
            help='Archivos específicos a incluir (ej: models.py views.py)'
        )
        
        include_group.add_argument(
            '--include-pattern',
            '-p',
            nargs='+',
            help='Patrones de archivos a incluir (ej: *view*.py *model*.py)'
        )
        
        include_group.add_argument(
            '--include-all',
            action='store_true',
            help='Incluir todos los archivos .py (excepto ignorados)'
        )
        
        include_group.add_argument(
            '--include-migrations',
            '-m',
            action='store_true',
            help='Incluir archivos de migraciones'
        )
        
        include_group.add_argument(
            '--include-tests',
            '-t',
            action='store_true',
            help='Incluir archivos de tests'
        )
        
        include_group.add_argument(
            '--include-templates',
            '-T',
            action='store_true',
            help='Incluir archivos de plantillas HTML (templates)'
        )
        
        include_group.add_argument(
            '--app',
            '-a',
            type=str,
            help='Extraer solo de una aplicación específica'
        )
        
        # Argumentos de exclusión
        exclude_group.add_argument(
            '--exclude',
            '-e',
            nargs='+',
            help='Archivos específicos a excluir (ej: __init__.py settings.py)'
        )
        
        exclude_group.add_argument(
            '--exclude-pattern',
            '-x',
            nargs='+',
            help='Patrones de archivos a excluir (ej: *_test.py *_backup.py)'
        )
        
        # Argumentos de salida
        output_group.add_argument(
            '--output',
            '-o',
            type=str,
            default='backend_code_extract.txt',
            help='Nombre del archivo de salida (default: backend_code_extract.txt)'
        )
        
        output_group.add_argument(
            '--format',
            type=str,
            choices=['txt', 'md', 'json'],
            default='txt',
            help='Formato de salida: txt, md, o json (default: txt)'
        )
        
        output_group.add_argument(
            '--full-path',
            '-f',
            action='store_true',
            help='Mostrar rutas completas en lugar de relativas'
        )
        
        output_group.add_argument(
            '--min-lines',
            '-l',
            type=int,
            default=0,
            help='Líneas mínimas para considerar un archivo (default: 0)'
        )
        
        # Debug
        parser.add_argument(
            '--debug',
            '-d',
            action='store_true',
            help='Mostrar información detallada durante la ejecución'
        )
    
    def handle(self, *args, **options):
        """
        Método principal del comando
        """
        self.verbosity = options.get('verbosity', 1)
        self.debug = options.get('debug', False)
        
        self.project_path = Path(settings.BASE_DIR)
        self.output_file = Path(options['output'])
        self.format = options.get('format', 'txt')
        self.full_path = options.get('full_path', False)
        self.min_lines = options.get('min_lines', 0)
        self.specific_app = options.get('app')
        
        # Configurar inclusiones
        self.include_files = set(options.get('include', []) or [])
        self.include_patterns = options.get('include_pattern', []) or []
        self.include_all = options.get('include_all', False)
        self.include_migrations = options.get('include_migrations', False)
        self.include_tests = options.get('include_tests', False)
        self.include_templates = options.get('include_templates', False)
        
        # Configurar exclusiones
        self.exclude_files = set(options.get('exclude', []) or [])
        self.exclude_patterns = options.get('exclude_pattern', []) or []
        
        # Validar configuración
        self.validate_configuration()
        
        # Mensaje de inicio
        if self.verbosity >= 1:
            self.stdout.write(
                self.style.SUCCESS('🚀 Iniciando extracción de código Django')
            )
            self.stdout.write(f'📁 Proyecto: {self.project_path}')
            
            if self.specific_app:
                self.stdout.write(f'🎯 Aplicación específica: {self.specific_app}')
                app_path = self.project_path / self.specific_app
                if not app_path.exists():
                    raise CommandError(f'La aplicación "{self.specific_app}" no existe')
        
        self.extract_code(options)
    
    def validate_configuration(self):
        """Valida la configuración de inclusión/exclusión"""
        # Si no se especifica nada, incluir archivos comunes por defecto
        if not self.include_all and not self.include_files and not self.include_patterns and not self.include_templates:
            if self.verbosity >= 1:
                self.stdout.write(
                    self.style.WARNING('⚠️ No se especificaron archivos a incluir.')
                )
                self.stdout.write(
                    self.style.WARNING('📝 Usando archivos por defecto: models.py, views.py, urls.py, admin.py')
                )
                self.stdout.write(
                    self.style.WARNING('💡 Use --include-all para incluir todos los archivos')
                )
            
            # Archivos por defecto
            self.include_files = {'settings.py', 'models.py', 'views.py', 'urls.py', 'admin.py', 'serializers.py', 'services.py'}
    
    def should_ignore_dir(self, dir_path):
        """Determina si un directorio debe ser ignorado"""
        dir_name = dir_path.name
        
        # Ignorar directorios por nombre
        if dir_name in self.IGNORE_DIRS:
            return True
        
        # Ignorar directorios ocultos
        if dir_name.startswith('.'):
            return True
        
        # Si es una aplicación específica, solo procesar ese directorio
        if self.specific_app:
            try:
                rel_path = dir_path.relative_to(self.project_path)
                parts = rel_path.parts
                if parts and parts[0] != self.specific_app:
                    return True
            except ValueError:
                return True
        
        return False
    
    def should_ignore_file(self, file_path):
        """
        Determina si un archivo debe ser ignorado basado en IGNORE_FILES
        """
        file_name = file_path.name
        
        # Verificar si el archivo debe ser ignorado por nombre exacto
        if file_name in self.IGNORE_FILES:
            return True
        
        # Verificar si el archivo debe ser ignorado por patrón
        for pattern in self.IGNORE_FILES:
            if fnmatch.fnmatch(file_name, pattern):
                return True
        
        return False
    
    def should_include_file(self, file_path):
        """
        Determina si un archivo debe ser incluido en la extracción
        Usa un enfoque de whitelist (solo lo especificado)
        """
        # Verificar si es un archivo .py o .html
        if file_path.suffix not in ('.py', '.html'):
            return False
        
        # Verificar si el archivo está en IGNORE_FILES
        if self.should_ignore_file(file_path):
            return False
        
        # Obtener nombre del archivo y ruta relativa
        file_name = file_path.name
        rel_path = str(file_path.relative_to(self.project_path))
        
        # 1. VERIFICAR EXCLUSIONES (primero)
        # Excluir por nombre exacto
        if file_name in self.exclude_files:
            return False
        
        # Excluir por patrón
        for pattern in self.exclude_patterns:
            if fnmatch.fnmatch(file_name, pattern):
                return False
        
        # Excluir migraciones si no están habilitadas
        if 'migrations' in str(file_path.parent) and not self.include_migrations:
            return False
        
        # Excluir tests si no están habilitados
        if not self.include_tests:
            if 'tests' in str(file_path.parent) or file_name.startswith('test_'):
                return False
            if file_name == 'tests.py':
                return False
        
        # 2. VERIFICAR INCLUSIONES
        # Si --include-all está activado, incluir todo (excepto exclusiones)
        if self.include_all:
            return True
        
        # Incluir por nombre exacto
        if file_name in self.include_files:
            return True
        
        # Incluir por patrón
        for pattern in self.include_patterns:
            if fnmatch.fnmatch(file_name, pattern):
                return True
        
        # Incluir por ruta relativa (patrones completos)
        for pattern in self.include_patterns:
            if fnmatch.fnmatch(rel_path, pattern):
                return True
        
        # Incluir plantillas HTML si está activado
        if self.include_templates and file_path.suffix == '.html':
            return True
        
        # 3. VERIFICAR LÍNEAS MÍNIMAS
        if self.min_lines > 0:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    if len(lines) < self.min_lines:
                        return False
            except Exception as e:
                if self.debug:
                    self.stderr.write(f'Error al leer {file_path}: {e}')
                return False
        
        # Si llegamos aquí, el archivo no coincide con ningún criterio de inclusión
        return False
    
    def extract_file_content(self, file_path):
        """Extrae el contenido de un archivo con metadatos"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            lines = content.count('\n')
            
            if self.full_path:
                relative_path = str(file_path)
            else:
                try:
                    relative_path = str(file_path.relative_to(self.project_path))
                except ValueError:
                    relative_path = str(file_path)
            
            # Detectar tipo de archivo
            file_type = 'python' if file_path.suffix == '.py' else 'html'
            
            # Estadísticas específicas por tipo
            if file_type == 'python':
                class_count = len(re.findall(r'^class\s+\w+', content, re.MULTILINE))
                def_count = len(re.findall(r'^def\s+\w+', content, re.MULTILINE))
                import_count = len(re.findall(r'^import\s+|^from\s+', content, re.MULTILINE))
            else:
                # Para HTML no contamos clases/funciones/imports
                class_count = 0
                def_count = 0
                import_count = 0
            
            return {
                'file_path': relative_path,
                'file_name': file_path.name,
                'file_type': file_type,
                'content': content,
                'lines': lines,
                'classes': class_count,
                'functions': def_count,
                'imports': import_count,
                'app_name': self.get_app_name(file_path)
            }
            
        except Exception as e:
            if self.debug:
                self.stderr.write(f'Error al extraer {file_path}: {e}')
            return None
    
    def get_app_name(self, file_path):
        """Obtiene el nombre de la aplicación a partir de la ruta"""
        try:
            rel_path = file_path.relative_to(self.project_path)
            parts = rel_path.parts
            if len(parts) > 1:
                return parts[0]
        except:
            pass
        return "unknown"
    
    def extract_code(self, options):
        """Función principal para extraer código de todos los archivos"""
        
        if self.verbosity >= 1:
            self.stdout.write('-' * 80)
        
        all_files = []
        extracted_data = []
        total_files_scanned = 0
        total_ignored = 0
        
        # Recorrer todos los archivos
        for root, dirs, files in os.walk(self.project_path):
            root_path = Path(root)
            
            # Filtrar directorios a ignorar
            dirs[:] = [d for d in dirs if not self.should_ignore_dir(root_path / d)]
            
            # Procesar archivos .py y .html
            for file in files:
                file_path = root_path / file
                total_files_scanned += 1
                
                if self.should_include_file(file_path):
                    all_files.append(file_path)
                else:
                    total_ignored += 1
        
        if self.verbosity >= 1:
            self.stdout.write(
                self.style.SUCCESS(f'📁 Escaneados {total_files_scanned} archivos')
            )
            self.stdout.write(
                self.style.SUCCESS(f'📄 Encontrados {len(all_files)} archivos relevantes')
            )
            self.stdout.write(
                self.style.WARNING(f'⏭️  Ignorados {total_ignored} archivos')
            )
            self.stdout.write('-' * 80)
        
        if self.debug:
            self.stdout.write('Archivos encontrados:')
            for file_path in all_files:
                self.stdout.write(f'  📄 {file_path.relative_to(self.project_path)}')
            self.stdout.write('-' * 80)
        
        # Si no hay archivos, mostrar advertencia
        if not all_files:
            self.stdout.write(
                self.style.WARNING('⚠️ No se encontraron archivos para extraer')
            )
            self.stdout.write('💡 Sugerencias:')
            self.stdout.write('  • Use --include-all para incluir todos los archivos')
            self.stdout.write('  • Use --include para especificar archivos específicos')
            self.stdout.write('  • Use --include-pattern para patrones')
            self.stdout.write('  • Use --include-migrations para incluir migraciones')
            self.stdout.write('  • Use --include-templates para incluir plantillas HTML')
            return
        
        # Extraer contenido de cada archivo
        if self.verbosity >= 2:
            self.stdout.write('Extrayendo contenido de archivos...')
        
        for i, file_path in enumerate(all_files, 1):
            if self.debug:
                self.stdout.write(f'Procesando: {file_path.relative_to(self.project_path)}')
            elif self.verbosity >= 2 and i % 10 == 0:
                self.stdout.write(f'Progreso: {i}/{len(all_files)} archivos')
            
            data = self.extract_file_content(file_path)
            if data:
                extracted_data.append(data)
        
        if self.verbosity >= 1:
            self.stdout.write('-' * 80)
        
        # Ordenar por nombre de archivo
        extracted_data.sort(key=lambda x: x['file_name'])
        
        # Guardar en archivo según el formato
        if self.format == 'json':
            self.save_as_json(extracted_data, options)
        elif self.format == 'md':
            self.save_as_markdown(extracted_data, options)
        else:
            self.save_as_text(extracted_data, options)
        
        # Mostrar estadísticas finales
        total_lines = sum(d['lines'] for d in extracted_data)
        total_files = len(extracted_data)
        py_files = sum(1 for d in extracted_data if d['file_type'] == 'python')
        html_files = sum(1 for d in extracted_data if d['file_type'] == 'html')
        
        if self.verbosity >= 1:
            self.stdout.write('-' * 80)
            self.stdout.write(self.style.SUCCESS('✅ Extracción completada!'))
            self.stdout.write(f'📊 Archivos procesados: {total_files}')
            self.stdout.write(f'   🐍 Python: {py_files}')
            self.stdout.write(f'   🌐 HTML: {html_files}')
            self.stdout.write(f'📝 Líneas de código: {total_lines}')
            self.stdout.write(f'💾 Guardado en: {self.output_file}')
            
            # Mostrar estadísticas por tipo
            self.stdout.write('\n📊 Estadísticas:')
            self.stdout.write(f'  📄 Total archivos: {total_files}')
            self.stdout.write(f'  📝 Total líneas: {total_lines}')
            self.stdout.write(f'  📁 Aplicaciones: {len(set(d["app_name"] for d in extracted_data))}')
            
            self.stdout.write('-' * 80)
    
    def save_as_text(self, extracted_data, options):
        """Guarda los datos en formato TXT"""
        with open(self.output_file, 'w', encoding='utf-8') as f:
            # Encabezado
            f.write("=" * 100 + "\n")
            f.write(f"📊 EXTRACCIÓN DE CÓDIGO DJANGO\n")
            f.write(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"📁 Proyecto: {self.project_path}\n")
            f.write(f"📄 Archivos extraídos: {len(extracted_data)}\n")
            f.write(f"📝 Líneas de código: {sum(d['lines'] for d in extracted_data)}\n")
            if self.specific_app:
                f.write(f"🎯 Aplicación específica: {self.specific_app}\n")
            if self.include_files:
                f.write(f"📌 Archivos incluidos: {', '.join(self.include_files)}\n")
            if self.include_patterns:
                f.write(f"📌 Patrones incluidos: {', '.join(self.include_patterns)}\n")
            if self.include_templates:
                f.write(f"🌐 Incluyendo plantillas HTML\n")
            f.write("=" * 100 + "\n\n")
            
            # Índice
            f.write("📑 ÍNDICE DE ARCHIVOS\n")
            f.write("-" * 100 + "\n")
            
            for data in extracted_data:
                f.write(f"📄 {data['file_path']} ")
                f.write(f"({data['lines']} líneas")
                if data['file_type'] == 'python':
                    f.write(f", {data['classes']} clases, {data['functions']} funciones, {data['imports']} imports")
                else:
                    f.write(f", plantilla HTML")
                f.write(")")
                if data['app_name'] != 'unknown':
                    f.write(f" [app: {data['app_name']}]")
                f.write("\n")
            
            # Contenido de los archivos
            f.write("\n\n" + "=" * 100 + "\n")
            f.write("📝 CONTENIDO DE LOS ARCHIVOS\n")
            f.write("=" * 100 + "\n\n")
            
            for data in extracted_data:
                # Encabezado del archivo
                f.write(f"\n{'=' * 100}\n")
                f.write(f"📄 ARCHIVO: {data['file_path']}\n")
                f.write(f"📝 Líneas: {data['lines']}\n")
                if data['file_type'] == 'python':
                    f.write(f"🔷 Clases: {data['classes']}\n")
                    f.write(f"🔹 Funciones: {data['functions']}\n")
                    f.write(f"📦 Imports: {data['imports']}\n")
                else:
                    f.write(f"🌐 Tipo: HTML\n")
                if data['app_name'] != 'unknown':
                    f.write(f"📱 Aplicación: {data['app_name']}\n")
                f.write(f"{'=' * 100}\n\n")
                
                # Contenido del código
                f.write(data['content'])
                if not data['content'].endswith('\n'):
                    f.write('\n')
                f.write("\n\n")
    
    def save_as_markdown(self, extracted_data, options):
        """Guarda los datos en formato Markdown"""
        md_file = self.output_file.with_suffix('.md')
        
        with open(md_file, 'w', encoding='utf-8') as f:
            # Encabezado
            f.write(f"# 📊 Extracción de Código Django\n\n")
            f.write(f"**Fecha:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"**Proyecto:** `{self.project_path}`\n\n")
            f.write(f"**Archivos extraídos:** {len(extracted_data)}\n\n")
            f.write(f"**Líneas de código:** {sum(d['lines'] for d in extracted_data)}\n\n")
            
            if self.specific_app:
                f.write(f"**Aplicación específica:** `{self.specific_app}`\n\n")
            if self.include_files:
                f.write(f"**Archivos incluidos:** `{', '.join(self.include_files)}`\n\n")
            if self.include_patterns:
                f.write(f"**Patrones incluidos:** `{', '.join(self.include_patterns)}`\n\n")
            if self.include_templates:
                f.write(f"**Incluyendo plantillas HTML**\n\n")
            
            f.write("---\n\n")
            
            # Índice
            f.write("## 📑 Índice de Archivos\n\n")
            
            for data in extracted_data:
                f.write(f"- `{data['file_path']}` ")
                f.write(f"({data['lines']} líneas")
                if data['file_type'] == 'python':
                    f.write(f", {data['classes']} clases, {data['functions']} funciones, {data['imports']} imports")
                else:
                    f.write(f", plantilla HTML")
                f.write(")")
                if data['app_name'] != 'unknown':
                    f.write(f" *app: {data['app_name']}*")
                f.write("\n")
            
            # Contenido de los archivos
            f.write("\n\n---\n\n")
            f.write("## 📝 Contenido de los Archivos\n\n")
            
            for data in extracted_data:
                # Encabezado del archivo
                f.write(f"\n### 📄 `{data['file_path']}`\n\n")
                f.write(f"**Líneas:** {data['lines']}  \n")
                if data['file_type'] == 'python':
                    f.write(f"**Clases:** {data['classes']}  \n")
                    f.write(f"**Funciones:** {data['functions']}  \n")
                    f.write(f"**Imports:** {data['imports']}  \n")
                else:
                    f.write(f"**Tipo:** HTML  \n")
                if data['app_name'] != 'unknown':
                    f.write(f"**Aplicación:** `{data['app_name']}`  \n")
                f.write("\n")
                
                # Contenido del código
                if data['file_type'] == 'python':
                    f.write("```python\n")
                else:
                    f.write("```html\n")
                f.write(data['content'])
                if not data['content'].endswith('\n'):
                    f.write('\n')
                f.write("```\n\n")
        
        self.output_file = md_file
    
    def save_as_json(self, extracted_data, options):
        """Guarda los datos en formato JSON"""
        import json
        
        json_file = self.output_file.with_suffix('.json')
        
        output_data = {
            'metadata': {
                'project': str(self.project_path),
                'extraction_date': datetime.now().isoformat(),
                'total_files': len(extracted_data),
                'total_lines': sum(d['lines'] for d in extracted_data),
                'specific_app': self.specific_app,
                'include_files': list(self.include_files),
                'include_patterns': self.include_patterns,
                'include_migrations': self.include_migrations,
                'include_tests': self.include_tests,
                'include_templates': self.include_templates,
                'min_lines': self.min_lines
            },
            'files': extracted_data
        }
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        self.output_file = json_file