# LiveCycle: sistema para detectar el ciclo de vida de los repuestos

En el mantenimiento industrial, la decisión de reparar o reemplazar un repuesto suele depender del criterio del mecánico. Si ese criterio es subjetivo, puede ocasionar tanto la sustitución prematura de piezas que aún tienen vida útil como la reutilización de componentes desgastados que podrían provocar fallas. LiveCycle ofrece una estimación orientativa basada en las horas de operación, la vida útil de referencia del componente y el desgaste visual observado, y registra el área y la máquina asociadas a la evaluación.

> **Nota:** Las estimaciones y vidas útiles del catálogo son referenciales, no están certificadas por los fabricantes y no sustituyen una inspección técnica ni las recomendaciones del fabricante.

## Tecnologías y Librerías Utilizadas

- **HTML5:** estructura y formularios de la interfaz.
- **CSS3:** presentación visual y diseño adaptable.
- **JavaScript vanilla:** lógica de acceso, evaluación, búsqueda y administración. No se utiliza un framework de JavaScript.
- **JSON:** almacenamiento del catálogo estático de componentes en `data.json`.
- **APIs del navegador:**
  - `fetch` carga el catálogo desde `data.json`.
  - `localStorage` conserva cuentas, sesión, perfil, áreas e historiales por cuenta en el navegador.
  - Web Crypto deriva hashes de contraseña con PBKDF2; nunca se guarda la contraseña en texto plano.
  - DOM y APIs de formularios gestionan las interacciones y validaciones.
- **Python 3:** `script.py` inicia un servidor HTTP local para ejecutar y probar la aplicación.
- **Google Fonts:** las fuentes DM Sans y Manrope se cargan desde Google Fonts. Son tipografías, no bibliotecas de JavaScript.

El proyecto no requiere `npm`, un proceso de compilación ni dependencias de terceros instaladas. Tampoco incluye un backend o conexión a una base de datos.

## Estructura del Repositorio

```text
proyecto-Ireana/
├── index.html    # Estructura de la aplicación y sus vistas.
├── app.js        # Lógica del cliente, evaluaciones y persistencia local.
├── style.css     # Estilos y adaptación de la interfaz.
├── data.json     # Catálogo de repuestos organizado por categorías.
├── script.py     # Servidor HTTP local para desarrollo.
└── README.md     # Documentación del proyecto.
```

## Instrucciones de Instalación y Configuración

### Ejecución local

1. Descarga o clona el proyecto y abre la carpeta `proyecto-Ireana`.
2. Inicia el servidor local incluido:

   **Windows (PowerShell):**

   ```powershell
   py script.py
   ```

   Opcionalmente, cambia el puerto con `py script.py --port 8080`. En macOS o Linux, ejecuta `python3 script.py`.

3. Abre `http://127.0.0.1:8000` en un navegador moderno.
4. Para detener el servidor, vuelve a la terminal y presiona `Ctrl+C`.

Se recomienda usar un servidor HTTP en lugar de abrir `index.html` directamente como archivo: el navegador puede restringir la solicitud `fetch` que carga `data.json` cuando se usa el protocolo `file://`.

### Despliegue en un servicio estático

1. Publica los archivos del proyecto en un servicio de alojamiento para sitios estáticos, como GitHub Pages o Netlify.
2. Configura la carpeta raíz del repositorio como origen del sitio. No se requiere comando de compilación ni carpeta de salida generada.
3. Confirma que `index.html`, `app.js`, `style.css` y `data.json` se encuentren en la misma carpeta publicada.
4. Abre la URL HTTPS proporcionada por el servicio y verifica que el catálogo cargue.

Las cuentas, áreas e historiales se guardan en `localStorage` para cada navegador y origen. El dashboard agrega las evaluaciones de todas las cuentas almacenadas en ese navegador; los historiales y reportes se muestran por cuenta. Por eso, los datos no se comparten entre dispositivos ni dominios. Las contraseñas se derivan con PBKDF2 y una sal aleatoria, pero la autenticación sigue ejecutándose en el navegador y no reemplaza un backend con base de datos para producción.

## Guía Rápida de Uso

1. **Crear una cuenta:** en la pantalla de acceso, selecciona el enlace de registro e ingresa el nombre, una cédula de 6 a 12 dígitos y una contraseña de al menos 8 caracteres. La cédula debe ser única en ese navegador.
2. **Iniciar sesión:** utiliza el nombre, la cédula y la contraseña registrados. Las cuentas antiguas sin contraseña deberán establecer una al iniciar sesión por primera vez.
3. **Registrar la ubicación de trabajo:** abre **Áreas**, agrega un área y luego registra las máquinas o equipos correspondientes. Estas opciones estarán disponibles en las evaluaciones.
4. **Dashboard:** al iniciar sesión, consulta el total de evaluaciones, dictámenes críticos, vida restante promedio y equipos evaluados. Las métricas se agregan en el navegador actual.
5. **Evaluar un componente:** desde el dashboard o la presentación inicial, selecciona **Evaluar componente**. Busca la pieza por nombre o referencia y elige una opción; completa área, máquina, horas de operación y nivel de desgaste observado; luego selecciona **Generar dictamen**.
6. **Revisar el resultado:** consulta la estimación de vida restante, la recomendación y la próxima revisión. El dictamen es orientativo y debe contrastarse con la inspección técnica.
7. **Consultar el catálogo:** abre **Catálogo de repuestos** para buscar componentes o filtrar por familia.
8. **Consultar el historial:** abre **Historial de auditoría** para revisar las evaluaciones persistentes de tu cuenta.
9. **Generar un reporte:** abre **Reportes**, filtra por fechas y dictamen y selecciona **Exportar CSV** para descargar los registros visibles.
10. **Cerrar sesión:** selecciona **Salir**. La cuenta permanece guardada en el navegador para futuros accesos.
