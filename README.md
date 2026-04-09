# BarberOS

Sistema de gestion para barberias desarrollado como aplicacion de escritorio. Permite administrar turnos, clientes y servicios desde una interfaz intuitiva sin necesidad de conexion a internet.

![Version](https://img.shields.io/badge/Version-1.0.14-A78BFA?style=for-the-badge)
![Estado](https://img.shields.io/badge/Estado-Activo-brightgreen?style=for-the-badge)
![Plataforma](https://img.shields.io/badge/Plataforma-Escritorio-181717?style=for-the-badge)

---

## Tecnologias

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

---

## Funcionalidades

- Gestion de turnos y reservas
- Administracion de clientes
- Gestion de servicios y precios
- Sistema de usuarios con roles (PRO)
- Funciona completamente offline
- Actualizaciones incrementales con soporte de versiones

---

## Estructura del proyecto

```
BarberOS/
├── frontend/        # Interfaz desarrollada con React
├── backend/         # Logica del servidor con Node.js
├── main.js          # Punto de entrada de Electron
├── preload.js       # Bridge entre Electron y el frontend
└── .env.example     # Variables de entorno necesarias
```

---

## Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/leni021/BarberOS.git

# Entrar al directorio
cd BarberOS

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start
```

---

## Releases

El proyecto cuenta con **15 versiones publicadas**. Cada release incluye mejoras incrementales, correcciones y nuevas funcionalidades. Ver el historial completo en la seccion [Releases](https://github.com/leni021/BarberOS/releases).

---

## Autor

**Lenning Favian Hidalgo Ramos**
Estudiante de Diseño Multimedial — Argentina
[github.com/leni021](https://github.com/leni021) · favian0218@gmail.com
