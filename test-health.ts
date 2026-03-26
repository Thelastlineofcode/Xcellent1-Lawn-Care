try {
  const res = await fetch("http://localhost:8000/health");
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
} catch (error) {
  console.log("Error:", error.message);
}
