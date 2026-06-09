import app from "./app";

const PORT = Number(process.env.PORT ?? 4100);

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
