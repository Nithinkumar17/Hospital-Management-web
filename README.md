# Carepoint Hospital Management

Hospital management dashboard built with React, TypeScript, React Router, and plain CSS. Patient and doctor records are loaded from the companion `hospital_api` backend.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run build` to run strict TypeScript checking and create a production build.

## Data/API seam

`src/services.ts` sends patient and doctor `get/add/update/delete` requests to `http://localhost:4000/api` by default. Set `VITE_API_BASE_URL` to use another API base URL. Data models are defined in `src/types.ts`.
