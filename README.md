# WPE Frontend

React 18 + Vite + TypeScript admin frontend for the WPE backend split across:

- Core API: `VITE_CORE_API_URL`
- GRN API: `VITE_GRN_API_URL`

## Run

1. Create a frontend env file from `.env.example`.
2. Install dependencies.
3. Start the backend services:
   - Core at `http://127.0.0.1:8000`
   - GRN at `http://127.0.0.1:8000`
4. Run the frontend:

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Architecture

- `src/lib/api.ts`: dual Axios clients, bearer token injection, refresh-on-401, token persistence.
- `src/providers/AuthProvider.tsx`: app auth bootstrap, login/logout state, forced logout handling.
- `src/pages/*`: module pages for Login, Dashboard, Contacts, Items, Blending, GRN, and QCR.
- `src/components/*`: shared layout, page headers, stat cards, error/loading states, and confirm dialog.

## Backend Assumptions Preserved

- Exact duplicated backend paths are used as-is, including `/api/items/items/`, `/api/contacts/contacts/`, `/api/grn/`, and `/api/qcr/`.
- Core and GRN services share the same JWT bearer token.
- GRN list responses are normalized from `{ status, message, count, data }`.
- QCR list responses are treated as plain arrays.
- GRN create submits nested payload sections exactly as:
  - `document_details`
  - `document_requirement_details`
  - `supplier_details`
  - `items`
  - `value_details`
