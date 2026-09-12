# Product Definition — Equi Document Intelligence

## Project Statement

### Option A: Aplicación Web de Inteligencia de Documentos

**Integración: Google Drive mediante OAuth**

Construir una aplicación web que se conecte al Google Drive de un usuario mediante OAuth y monitoree una carpeta específica que contenga documentos financieros, como PDFs, emails en HTML y archivos CSV. Algunos ejemplos son factsheets de fondos, estados de cuenta y reportes de rendimiento provenientes de distintos gestores.

La aplicación debe utilizar LLMs para extraer información estructurada de estos documentos. Los resultados deben almacenarse en una base de datos y estar disponibles desde una interfaz que permita explorar, buscar y consultar toda la información que haya sido procesada.

El sistema debe asumir que cada documento puede tener una estructura diferente: distintos layouts, terminología y formatos. El usuario no debería tener que configurar un parser específico para cada tipo de documento.

La conexión con Google Drive debe mantenerse sincronizada, de manera que cualquier archivo nuevo que se agregue a la carpeta seleccionada sea detectado y procesado automáticamente, sin necesidad de volver a subirlo manualmente.

### Experiencia esperada

> “Conecto mi Google Drive, selecciono una carpeta que contiene 20 PDFs desordenados de diferentes gestores de fondos y puedo ver una tabla con toda la información de rendimiento extraída. Puedo filtrar por fondo o fecha y, si posteriormente se agrega un nuevo factsheet a la carpeta, el sistema lo procesa automáticamente.”

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

The dashboard will use **Shadcn Fintech** as the UI foundation.

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

