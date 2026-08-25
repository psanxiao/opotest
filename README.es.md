# OpoTest - Simulador de Exámenes de Oposición con IA (Gemini)

> 🌐 **Language / Idioma:** [English](README.md) | **Español**

OpoTest es una aplicación web diseñada para ayudar a opositores a preparar sus exámenes tipo test a partir de sus propios temas en formato PDF. 

La aplicación permite subir archivos PDF, extraer su texto de forma segura, guardarlos de forma persistente, generar exámenes personalizados con un número de preguntas y tiempo límite seleccionados, realizar la simulación en una interfaz responsiva (móvil y escritorio) con autoguardado automático, y obtener una calificación detallada con explicaciones razonadas de cada respuesta proporcionadas por Gemini.

---

## Requisitos Previos

Asegúrate de tener instalado en tu máquina:
1. **Docker y Docker Compose**: Para ejecutar la base de datos PostgreSQL local.
2. **Python 3.10 o superior**: Para ejecutar el backend de la API.
3. **Node.js 18 o superior** (LTS recomendada v20+): Para el frontend de React.

---

## Estructura del Proyecto

* `/backend`: Servidor API ligero desarrollado con **FastAPI**, **SQLAlchemy** y el SDK de **Gemini** en Python.
* `/frontend`: Aplicación web interactiva desarrollada con **React (Vite)** y **Vanilla CSS** (Mobile-First y Modo Oscuro).
* `docker-compose.yml`: Orquestador para levantar la base de datos **PostgreSQL** de manera local en un contenedor Docker.

---

## Guía de Instalación y Arranque Rápido

Sigue estos pasos en tu terminal para levantar toda la aplicación:

### Paso 1: Levantar la Base de Datos (Docker)
Desde la raíz del proyecto, ejecuta el siguiente comando para iniciar PostgreSQL en segundo plano:
```bash
docker compose up -d
```
*Esto creará un contenedor llamado `opotest-db` escuchando en el puerto local `5435` con persistencia de datos.*

### Paso 2: Configurar e Iniciar el Backend (Python)
1. Abre una pestaña en tu terminal y entra en la carpeta `backend/`:
   ```bash
   cd backend
   ```
2. Crea un entorno virtual de Python:
   ```bash
   python3 -m venv venv
   ```
3. Activa el entorno virtual:
   - En macOS / Linux:
     ```bash
     source venv/bin/activate
     ```
   - En Windows (PowerShell):
     ```bash
     .\venv\Scripts\Activate.ps1
     ```
4. Instala todas las dependencias requeridas:
   ```bash
   pip install -r requirements.txt
   ```
5. **Configura las variables de entorno**:
   Copia el archivo de ejemplo y revisa las variables:
   ```bash
   cp .env.example .env
   ```
6. Inicia el servidor de desarrollo del backend:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```
   *El backend estará listo y corriendo en `http://localhost:8001`. Puedes verificar la documentación automática de los endpoints en `http://localhost:8001/docs`.*

### Paso 3: Iniciar el Frontend (React)
1. Abre otra pestaña en tu terminal y entra en la carpeta `frontend/`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de Node:
   ```bash
   npm install
   ```
3. Arranca el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en la dirección indicada (por defecto, `http://localhost:5173`).

---

## Despliegue en Producción

A continuación se detallan las instrucciones para desplegar la aplicación en un servidor dedicado, diferenciando entre un **Servidor Linux (Ubuntu/Debian)** y un **Servidor macOS (Mac mini / Servidor Local)**.

```mermaid
flowchart LR
    User["Usuario / Navegador"] -->|HTTP / HTTPS| Apache["Apache Reverse Proxy"]
    Apache -->|"/" (Archivos estáticos)| Dist["frontend/dist"]
    Apache -->|"/api"| FastAPI["FastAPI :8001"]
    FastAPI -->|"PostgreSQL :5435"| DB[("PostgreSQL Docker")]
    FastAPI -->|"Subproceso CLI"| AGY["Antigravity CLI / Gemini"]
```

---

### Opción A: Servidor Linux (Ubuntu / Debian)

#### 1. Clonar el repositorio y levantar la base de datos
Desde el directorio donde desees alojar la aplicación (ejemplo: `/var/www/opotest`):
```bash
git clone <URL_DEL_REPOSITORIO> /var/www/opotest
cd /var/www/opotest
docker compose up -d
```

#### 2. Configurar el Backend (Python)
1. Prepara el entorno virtual e instala dependencias:
   ```bash
   cd /var/www/opotest/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```
2. Crea un servicio systemd para que el backend se ejecute en segundo plano y arranque automáticamente:
   ```bash
   sudo nano /etc/systemd/system/opotest-backend.service
   ```
3. Pega la siguiente configuración (ajusta `User` y rutas según tu servidor):
   ```ini
   [Unit]
   Description=OpoTest Backend API (FastAPI)
   After=network.target docker.service

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/opotest/backend
   ExecStart=/var/www/opotest/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 2
   Restart=always
   RestartSec=5
   EnvironmentFile=/var/www/opotest/backend/.env

   [Install]
   WantedBy=multi-user.target
   ```
4. Habilita e inicia el servicio:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable opotest-backend
   sudo systemctl start opotest-backend
   ```

#### 3. Compilar el Frontend
```bash
cd /var/www/opotest/frontend
npm install
npm run build
```
*Los archivos estáticos listos para producción quedarán en `/var/www/opotest/frontend/dist`.*

#### 4. Configurar Apache 2 en Linux
1. Instala Apache y habilita los módulos necesarios de proxy, cabeceras y reescritura:
   ```bash
   sudo apt update
   sudo apt install apache2 -y
   sudo a2enmod proxy proxy_http rewrite headers ssl
   ```
2. Crea el archivo de VirtualHost del sitio:
   ```bash
   sudo nano /etc/apache2/sites-available/opotest.conf
   ```
3. Añade la configuración para servir el frontend estático y redirigir `/api` al backend:
   ```apache
   <VirtualHost *:80>
       ServerName tudominio.com
       DocumentRoot /var/www/opotest/frontend/dist

       # Aumentar límite de subida para PDFs grandes (50MB)
       LimitRequestBody 52428800

       # Proxy hacia el Backend FastAPI
       ProxyPreserveHost On
       ProxyRequests Off
       ProxyPass /api/ http://127.0.0.1:8001/api/ timeout=600 retry=0
       ProxyPassReverse /api/ http://127.0.0.1:8001/api/

       # Enrutamiento SPA (React Router / HTML5 History API)
       <Directory /var/www/opotest/frontend/dist>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted

           RewriteEngine On
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule ^ index.html [L]
       </Directory>

       ErrorLog ${APACHE_LOG_DIR}/opotest_error.log
       CustomLog ${APACHE_LOG_DIR}/opotest_access.log combined
   </VirtualHost>
   ```
4. Habilita el sitio y reinicia Apache:
   ```bash
   sudo a2ensite opotest.conf
   sudo a2dissite 000-default.conf # Opcional si es el sitio principal
   sudo apache2ctl configtest
   sudo systemctl restart apache2
   ```

---

### Opción B: Servidor macOS (Mac mini / macOS Server)

#### 1. Clonar el repositorio y levantar la base de datos
Desde el directorio donde desees alojar la aplicación (ejemplo: `~/Sites/opotest`):
```bash
git clone <URL_DEL_REPOSITORIO> ~/Sites/opotest
cd ~/Sites/opotest
docker compose up -d
```

#### 2. Configurar el Backend (Python)
1. Prepara el entorno virtual e instala dependencias:
   ```bash
   cd ~/Sites/opotest/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   ```
2. Para mantener el backend ejecutándose en segundo plano en macOS, la opción más sencilla y recomendada es **PM2**:
   ```bash
   # Instalar PM2 globalmente
   npm install -g pm2

   # Iniciar el backend con PM2
   pm2 start "venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001" --name opotest-backend

   # Configurar arranque automático al reiniciar el Mac
   pm2 startup
   pm2 save
   ```

#### 3. Compilar el Frontend
```bash
cd ~/Sites/opotest/frontend
npm install
npm run build
```

#### 4. Configurar Apache en macOS (mediante Homebrew)
1. Instala Apache mediante Homebrew si no lo tienes:
   ```bash
   brew install httpd
   ```
2. Abre la configuración principal de Apache (`/opt/homebrew/etc/httpd/httpd.conf` en Apple Silicon o `/usr/local/etc/httpd/httpd.conf` en Intel) y asegúrate de que los siguientes módulos estén descomentados (sin `#` al principio):
   ```apache
   LoadModule proxy_module lib/httpd/modules/mod_proxy.so
   LoadModule proxy_http_module lib/httpd/modules/mod_proxy_http.so
   LoadModule rewrite_module lib/httpd/modules/mod_rewrite.so
   LoadModule headers_module lib/httpd/modules/mod_headers.so
   ```
   Y al final del archivo, asegúrate de tener descomentada la línea que incluye los Virtual Hosts:
   ```apache
   Include /opt/homebrew/etc/httpd/extra/httpd-vhosts.conf
   ```
3. Edita el archivo de Virtual Hosts (`/opt/homebrew/etc/httpd/extra/httpd-vhosts.conf`) y añade:
   ```apache
   <VirtualHost *:8080>
       ServerName localhost
       # Reemplaza TU_USUARIO por tu nombre de usuario en macOS
       DocumentRoot "/Users/TU_USUARIO/Sites/opotest/frontend/dist"

       LimitRequestBody 52428800

       ProxyPreserveHost On
       ProxyRequests Off
       ProxyPass /api/ http://127.0.0.1:8001/api/ timeout=600 retry=0
       ProxyPassReverse /api/ http://127.0.0.1:8001/api/

       <Directory "/Users/TU_USUARIO/Sites/opotest/frontend/dist">
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted

           RewriteEngine On
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule ^ index.html [L]
       </Directory>

       ErrorLog "/opt/homebrew/var/log/httpd/opotest_error.log"
       CustomLog "/opt/homebrew/var/log/httpd/opotest_access.log" combined
   </VirtualHost>
   ```
4. Inicia o reinicia el servicio de Apache con Homebrew:
   ```bash
   brew services restart httpd
   ```

---

## Características de Usabilidad y Autoguardado

* **Modo Noche / Día**: Puedes alternar entre temas oscuros y claros con el botón ☀️/🌙 en la barra superior.
* **Autoguardado Automático**: Durante la prueba, tus respuestas y el tiempo restante se guardan automáticamente en tu base de datos cada 10 segundos y en cada cambio de respuesta.
* **Pausar y Continuar**: Puedes pausar el examen en cualquier momento pulsando "Pausar y Salir". Podrás reanudarlo exactamente en el mismo estado desde la pestaña "Historial" en cualquier momento.
* **Diseño para Móvil**: En pantallas móviles, las opciones de respuesta se amplían para facilitar el tacto sin errores, y el menú de navegación se simplifica para ahorrar espacio.

---

## Licencia

Este proyecto está bajo la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
