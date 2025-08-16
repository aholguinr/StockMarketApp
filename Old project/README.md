# andyWaHub
Hub de soluciones de watsonx en fastAPI


### 2. Crear un entorno virtual
Crea un entorno virtual para aislar las dependencias del proyecto:

En Windows:
```bash
python -m venv venv
``` 

En macOS/Linux:
```bash
python3 -m venv venv
``` 

### 3. Activar el entorno virtual
En Windows:
```bash
venv\Scripts\Activate
``` 

En macOS/Linux:
```bash
source venv/bin/activate
``` 

### 4. Instalar las dependencias
Una vez que el entorno virtual esté activado, instala las dependencias del proyecto utilizando el archivo requirements.txt:
```bash
pip install -r requirements.txt
``` 


### 5. Configurar las variables de entorno
Este proyecto utiliza variables de entorno para configurar las credenciales de IBM WatsonX. Crea un archivo .env en la raíz del proyecto con las siguientes variables:
```bash
WATSONX_APIKEY=tu_api_key_aqui
WATSONX_PROJECT_ID=tu_project_id_aqui
URL=tu_url_de_servicio_watsonx_aqui
``` 

### 6. Ejecutar el proyecto
Una vez que las dependencias estén instaladas y las variables de entorno configuradas, puedes iniciar el servidor 
```bash
./run.sh



### 7. Mirar la API

interactive API Documentation: http://...:{port}/docs
Alternative API Docs: http://...:{port}/redocs

``` 
