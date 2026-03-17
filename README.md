# Outfit Al Día

Es un aplicativo diseñado para la gestión inteligente del armario y ropa, permitiendo a las usuarias registrar, organizar y planificar sus outfits diarios.

## Arquitectura y Stack Tecnológico

Este proyecto utiliza una arquitectura cliente-servidor estructurada en un monorepo:

### Frontend (Presentación)
* **Framework:** React con Ionic (TypeScript)
* **Plataforma:** Web "Responsive" y Mobile-first

### Backend (Lógica y Servicios)
* **Entorno:** Node.js con Express (TypeScript)
* **ORM:** Prisma (v7.5+)
* **Autenticación:** JSON Web Tokens (JWT) y bcrypt para hashing de contraseñas.

### Base de Datos y Almacenamiento
* **Motor:** PostgreSQL (Alojado en Neon.tech)
* **Imágenes:** Cloudinary (Próximamente para la gestión de fotos de prendas)

## Estructura del Proyecto

El repositorio está dividido en dos directorios principales:
* `/backend`: Contiene la API REST, la lógica de negocio y la configuración de Prisma.
* `/frontend`: Contiene la interfaz de usuario desarrollada con Ionic/React.

## Cómo ejecutar el proyecto localmente

### 1. Clonar el repositorio
\`\`\`bash
git clone https://github.com/sergium-tg/ProInf_OutfitAlDia.git
cd ProInf_OutfitAlDia
\`\`\`

### 2. Configurar el Backend
1. Navegar a la carpeta del servidor: `cd backend`
2. Instalar las dependencias: `npm install`
3. Crea un archivo `.env` en la raíz de `/backend` y agrega la URL de conexión a tu base de datos:
   \`DATABASE_URL="postgresql://usuario:password@servidor.neon.tech/neondb?sslmode=require"\`
4. Generar el cliente de Prisma: `npx prisma generate`
5. Sincronizar la base de datos: `npx prisma db push`
6. Iniciar el servidor de desarrollo: `npx ts-node src/index.ts`
   *(El servidor correrá en `http://localhost:3000`)*

### 3. Configurar el Frontend
1. Abrir una nueva terminal y navega a la carpeta del cliente: `cd frontend`
2. Instalar las dependencias: `npm install`
3. Iniciar la aplicación: `ionic serve`
