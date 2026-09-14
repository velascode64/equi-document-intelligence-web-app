# Product Definition — Equi Document Intelligence

## Project Statement

### Option A: Aplicación Web de Inteligencia de Documentos

Integración: Google Drive (OAuth)
Desarrollar una aplicación web que se conecte a Google Drive del usuario mediante OAuth, monitoree una carpeta específica en busca de documentos financieros (PDF, correos electrónicos en HTML, archivos CSV —como fichas técnicas de fondos, estados de cuenta e informes de rendimiento de distintos gestores) y utilice modelos de lenguaje (LLM) para extraer datos estructurados. El sistema almacenará los resultados en una base de datos y ofrecerá una interfaz de usuario para explorar, buscar y realizar consultas sobre toda la información procesada.

La aplicación debe adaptarse a la realidad de que cada documento es diferente: distintos diseños, terminología variada y formatos diversos. El usuario no debería tener que configurar un analizador (parser) para cada documento. La conexión con Google Drive debe sincronizarse de modo que los nuevos archivos añadidos a la carpeta se detecten y procesen automáticamente, sin necesidad de volver a subirlos de forma manual.

Imagine el siguiente escenario: "Conecto mi cuenta de Google Drive, selecciono una carpeta que contiene 20 archivos PDF de formato irregular provenientes de distintos gestores de fondos y, de inmediato, puedo visualizar una tabla con todos los datos de rendimiento extraídos, filtrar por fondo o fecha y preguntar: '¿Qué fondo obtuvo el mejor rendimiento en enero?'; además, cuando llega una nueva ficha técnica a la carpeta, esta se procesa automáticamente".


---

## Product Goal

Build a simple web application that connects to a user's Google Drive, watches a selected folder for financial documents, extracts structured financial data from those files, and makes the results easy to browse, search, and filter.

The main user experience should feel like:

> Connect Drive → choose a folder → documents are processed automatically → extracted financial data appears in a clean dashboard.

The user should not need to configure custom parsers for each document format.

---

## Core User Flow

1. User signs in.
2. User connects Google Drive through OAuth.
3. User selects one Drive folder to monitor.
4. The app discovers supported files inside the folder.
5. Each document is processed automatically.
6. The system extracts normalized financial information using an LLM.
7. Extracted data is stored in PostgreSQL.
8. The dashboard shows the processed documents and extracted financial records.
9. The user can search and filter the extracted information.
10. New files added to the Drive folder are detected and processed automatically.

---

## Supported Documents

Initial scope:

* PDF
* CSV
* HTML

Typical examples:

* Fund factsheets
* Performance reports
* Account statements
* Manager reports
* Financial emails exported as HTML

The system should assume documents may use different terminology, layouts, and structures.

---

## Core Product Areas

### Drive

Responsible for:

* Google OAuth connection
* Folder selection
* Discovering files
* Detecting new or updated files
* Triggering document processing

### Documents

Each ingested document should expose:

* File name
* File type
* Source
* Processing status
* Processing date
* Extraction result

Basic statuses:

`pending → processing → completed → failed`

### Extraction

The extraction pipeline transforms an unstructured document into normalized financial data.

Initial target information may include:

* Fund name
* Fund manager
* Reporting period
* Monthly return
* YTD return
* NAV
* Currency
* Benchmark

The extraction schema can evolve once we have representative sample documents.

The raw extraction result can also be retained to avoid losing information that is not yet represented in the normalized schema.

### Dashboard

The dashboard uses the shared application design system as its UI foundation.

Initial views:

* Overview
* Documents
* Performance

The primary experience is a normalized financial data table where information extracted from different documents can be compared.

Example:

| Fund        | Manager   | Period   | Return | Source        |
| ----------- | --------- | -------- | -----: | ------------- |
| Alpha Fund  | Manager A | Jan 2026 |   4.2% | factsheet.pdf |
| Growth Fund | Manager B | Jan 2026 |   3.7% | report.pdf    |

Users should be able to:

* Search by fund or manager
* Filter by fund
* Filter by reporting period/date
* Sort by performance
* Open the source document / extraction details

This should be enough to answer questions such as:

> Which fund had the best January return?

without requiring an AI agent or conversational interface.

---

## Non-Goals

For the initial version we are **not** building:

* AI agent
* Chat interface
* Complex RAG infrastructure
* Vector search
* Custom parser configuration per fund manager
* Advanced portfolio analytics
* Multiple Drive providers
* Workflow builders
* Complex permissions or enterprise roles
* A generalized document-processing platform
