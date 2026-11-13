import catalog from "../../../../../source-ao/data/public-catalog.json";

export const prerender = true;

export const GET = () => new Response(JSON.stringify(catalog), {
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=300, stale-while-revalidate=300"
  }
});
